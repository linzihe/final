import { Article, ArticleType, Member, MemberRank, Comment } from '../types';
import { createClient } from '@supabase/supabase-js';

// 从环境变量获取 Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 创建 Supabase 客户端
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// 辅助函数：将数据库格式转换为应用格式
const dbMemberToMember = (dbMember: any): Member => ({
  id: dbMember.id,
  name: dbMember.name,
  codename: dbMember.codename,
  password: dbMember.password,
  email: dbMember.email,
  photoUrl: dbMember.photo_url,
  rank: dbMember.rank as MemberRank,
  joinedDate: dbMember.joined_date,
  active: dbMember.active,
  notes: dbMember.notes,
});

const memberToDbMember = (member: Member): any => ({
  id: member.id,
  name: member.name,
  codename: member.codename,
  password: member.password,
  email: member.email,
  photo_url: member.photoUrl,
  rank: member.rank,
  joined_date: member.joinedDate,
  active: member.active,
  notes: member.notes,
});

const dbArticleToArticle = async (dbArticle: any): Promise<Article> => {
  // 获取评论
  const { data: comments } = await supabase!
    .from('comments')
    .select('*')
    .eq('article_id', dbArticle.id)
    .is('parent_id', null)
    .order('created_at', { ascending: true });

  // 构建评论树
  const buildCommentTree = async (parentComments: any[]): Promise<Comment[]> => {
    const result: Comment[] = [];
    for (const comment of parentComments) {
      const { data: replies } = await supabase!
        .from('comments')
        .select('*')
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true });

      result.push({
        id: comment.id,
        author: comment.author,
        date: comment.date,
        content: comment.content,
        likes: comment.likes || 0,
        replies: replies ? await buildCommentTree(replies) : [],
      });
    }
    return result;
  };

  const commentsTree = comments ? await buildCommentTree(comments) : [];

  return {
    id: dbArticle.id,
    title: dbArticle.title,
    author: dbArticle.author,
    date: dbArticle.date,
    type: dbArticle.type as ArticleType,
    content: dbArticle.content,
    tags: dbArticle.tags || [],
    isPinned: dbArticle.is_pinned || false,
    comments: commentsTree,
  };
};

const articleToDbArticle = (article: Article): any => ({
  id: article.id,
  title: article.title,
  author: article.author,
  date: article.date,
  type: article.type,
  content: article.content,
  tags: article.tags || [],
  is_pinned: article.isPinned || false,
});

// 如果没有配置 Supabase，使用 localStorage 作为后备
const useLocalStorage = !supabase;

export const db = {
  getMembers: async (): Promise<Member[]> => {
    if (useLocalStorage) {
      const data = localStorage.getItem('taor_members_v5');
      return data ? JSON.parse(data) : [];
    }

    try {
      const { data, error } = await supabase!.from('members').select('*');
      if (error) throw error;
      return data ? data.map(dbMemberToMember) : [];
    } catch (error) {
      console.error('Error fetching members:', error);
      return [];
    }
  },

  getMemberById: async (id: string): Promise<Member | undefined> => {
    const members = await db.getMembers();
    return members.find((m) => m.id === id);
  },

  authenticateUser: async (identifier: string, password: string): Promise<Member | undefined> => {
    const members = await db.getMembers();
    
    // ALIAS HANDLING: Map 'ADMIN' to the root user ID
    let searchKey = identifier;
    if (searchKey.toUpperCase() === 'ADMIN') {
      searchKey = 'AO-000-ALPHA';
    }

    // Case insensitive match for ID or Codename
    const member = members.find(m => 
      m.id.toLowerCase() === searchKey.toLowerCase() || 
      m.codename.toLowerCase() === searchKey.toLowerCase()
    );
    
    if (member && member.password === password) {
      return member;
    }
    return undefined;
  },

  addMember: async (member: Member): Promise<void> => {
    if (useLocalStorage) {
      const members = await db.getMembers();
      const existingIndex = members.findIndex(m => m.id === member.id);
      if (existingIndex >= 0) {
        const existingPassword = members[existingIndex].password;
        members[existingIndex] = { ...member, password: member.password || existingPassword };
      } else {
        members.push(member);
      }
      localStorage.setItem('taor_members_v5', JSON.stringify(members));
      return;
    }

    try {
      const dbMember = memberToDbMember(member);
      const { error } = await supabase!
        .from('members')
        .upsert(dbMember, { onConflict: 'id' });
      if (error) throw error;
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  },
  
  deleteMember: async (id: string): Promise<boolean> => {
    // SECURITY: Prevent deleting the Root Architect
    if (id === 'AO-000-ALPHA') return false;

    if (useLocalStorage) {
      const members = await db.getMembers();
      const initialLength = members.length;
      const filtered = members.filter(m => m.id !== id);
      if (filtered.length === initialLength) return false;
      localStorage.setItem('taor_members_v5', JSON.stringify(filtered));
      return true;
    }

    try {
      const { error } = await supabase!.from('members').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting member:', error);
      return false;
    }
  },

  getArticles: async (): Promise<Article[]> => {
    if (useLocalStorage) {
      const data = localStorage.getItem('taor_articles_v5');
      return data ? JSON.parse(data) : [];
    }

    try {
      const { data, error } = await supabase!
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (!data) return [];
      
      // 转换所有文章
      const articles = await Promise.all(data.map(dbArticleToArticle));
      return articles;
    } catch (error) {
      console.error('Error fetching articles:', error);
      return [];
    }
  },

  addArticle: async (article: Article): Promise<void> => {
    if (useLocalStorage) {
      const articles = await db.getArticles();
      const index = articles.findIndex(a => a.id === article.id);
      if (index !== -1) {
        articles[index] = { ...articles[index], ...article };
      } else {
        articles.unshift({
          ...article,
          comments: article.comments || [],
          isPinned: article.isPinned || false
        });
      }
      localStorage.setItem('taor_articles_v5', JSON.stringify(articles));
      return;
    }

    try {
      const dbArticle = articleToDbArticle(article);
      const { error } = await supabase!
        .from('articles')
        .upsert(dbArticle, { onConflict: 'id' });
      if (error) throw error;
    } catch (error) {
      console.error('Error adding article:', error);
      throw error;
    }
  },

  deleteArticle: async (id: string): Promise<boolean> => {
    if (useLocalStorage) {
      const articles = await db.getArticles();
      const initialLength = articles.length;
      const filtered = articles.filter(a => a.id !== id);
      if (filtered.length === initialLength) return false;
      localStorage.setItem('taor_articles_v5', JSON.stringify(filtered));
      return true;
    }

    try {
      // 删除评论
      await supabase!.from('comments').delete().eq('article_id', id);
      // 删除文章
      const { error } = await supabase!.from('articles').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting article:', error);
      return false;
    }
  },

  togglePinArticle: async (id: string): Promise<void> => {
    if (useLocalStorage) {
      const articles = await db.getArticles();
      const article = articles.find(a => a.id === id);
      if (article) {
        article.isPinned = !article.isPinned;
        localStorage.setItem('taor_articles_v5', JSON.stringify(articles));
      }
      return;
    }

    try {
      // 先获取当前状态
      const { data: article } = await supabase!
        .from('articles')
        .select('is_pinned')
        .eq('id', id)
        .single();
      
      if (article) {
        const { error } = await supabase!
          .from('articles')
          .update({ is_pinned: !article.is_pinned })
          .eq('id', id);
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  },

  addComment: async (articleId: string, comment: Comment, parentId?: string): Promise<void> => {
    if (useLocalStorage) {
      const articles = await db.getArticles();
      const article = articles.find(a => a.id === articleId);
      if (article) {
        if (!article.comments) article.comments = [];
        if (parentId) {
          const parent = db.findComment(article.comments, parentId);
          if (parent) {
            parent.replies.push(comment);
          }
        } else {
          article.comments.push(comment);
        }
        localStorage.setItem('taor_articles_v5', JSON.stringify(articles));
      }
      return;
    }

    try {
      const { error } = await supabase!
        .from('comments')
        .insert({
          id: comment.id,
          article_id: articleId,
          parent_id: parentId || null,
          author: comment.author,
          date: comment.date,
          content: comment.content,
          likes: comment.likes || 0,
        });
      if (error) throw error;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  deleteComment: async (articleId: string, commentId: string): Promise<void> => {
    if (useLocalStorage) {
      const articles = await db.getArticles();
      const article = articles.find(a => a.id === articleId);
      if (article && article.comments) {
        const container = db.findCommentContainer(article.comments, commentId);
        if (container) {
          const idx = container.findIndex(c => c.id === commentId);
          if (idx !== -1) {
            container.splice(idx, 1);
            localStorage.setItem('taor_articles_v5', JSON.stringify(articles));
          }
        }
      }
      return;
    }

    try {
      // 删除所有子评论
      await supabase!.from('comments').delete().eq('parent_id', commentId);
      // 删除评论本身
      const { error } = await supabase!.from('comments').delete().eq('id', commentId);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  },

  likeComment: async (articleId: string, commentId: string): Promise<void> => {
    if (useLocalStorage) {
      const articles = await db.getArticles();
      const article = articles.find(a => a.id === articleId);
      if (article && article.comments) {
        const comment = db.findComment(article.comments, commentId);
        if (comment) {
          comment.likes += 1;
          localStorage.setItem('taor_articles_v5', JSON.stringify(articles));
        }
      }
      return;
    }

    try {
      // 获取当前点赞数
      const { data: comment } = await supabase!
        .from('comments')
        .select('likes')
        .eq('id', commentId)
        .single();
      
      if (comment) {
        const { error } = await supabase!
          .from('comments')
          .update({ likes: (comment.likes || 0) + 1 })
          .eq('id', commentId);
        if (error) throw error;
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  },

  findCommentContainer: (comments: Comment[], targetId: string): Comment[] | null => {
    for (let i = 0; i < comments.length; i++) {
      if (comments[i].id === targetId) return comments;
      if (comments[i].replies.length > 0) {
        const found = db.findCommentContainer(comments[i].replies, targetId);
        if (found) return found;
      }
    }
    return null;
  },
  
  findComment: (comments: Comment[], targetId: string): Comment | null => {
    for (const c of comments) {
      if (c.id === targetId) return c;
      const found = db.findComment(c.replies, targetId);
      if (found) return found;
    }
    return null;
  },

  reset: async (): Promise<void> => {
    if (useLocalStorage) {
      localStorage.removeItem('taor_members_v5');
      localStorage.removeItem('taor_articles_v5');
      return;
    }

    try {
      await supabase!.from('comments').delete().neq('id', '0');
      await supabase!.from('articles').delete().neq('id', '0');
      await supabase!.from('members').delete().neq('id', 'AO-000-ALPHA');
    } catch (error) {
      console.error('Error resetting database:', error);
    }
  }
};

