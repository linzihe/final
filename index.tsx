import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db } from './services/supabaseDb';
import { Member, Article, MemberRank, ArticleType, Comment } from './types';
import { translations, LangCode } from './services/translations';

// --- Icons ---
const ChaosStarIcon = () => (
  <img 
    src="https://i.imgs.ovh/2025/12/30/C30JfH.png" 
    alt="The Allunity Order Logo" 
    className="w-10 h-10 animate-pulse-fast object-contain" 
  />
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const PinIcon = ({ filled }: { filled?: boolean }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24 text-gray-400 dark:text-gray-700">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
);

const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);

const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);

const HeartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
);

// --- Helpers ---
const formatDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
};

// 检测内容是否为 Markdown
const isMarkdown = (content: string): boolean => {
    if (!content) return false;
    // 检查常见的 Markdown 语法
    const markdownPatterns = [
        /^#{1,6}\s/m,           // 标题
        /\*\*.*?\*\*/,          // 粗体
        /\*.*?\*/,              // 斜体
        /\[.*?\]\(.*?\)/,       // 链接
        /!\[.*?\]\(.*?\)/,      // 图片
        /^[-*+]\s/m,            // 无序列表
        /^\d+\.\s/m,            // 有序列表
        /^```[\s\S]*?```/m,     // 代码块
        /^`.*?`/m,              // 行内代码
        /^\|.*\|/m,             // 表格
        /^>\s/m,                // 引用
    ];
    return markdownPatterns.some(pattern => pattern.test(content));
};

// --- Components ---

const Navbar = ({ 
    setView, currentView, user, lang, setLang, theme, toggleTheme 
}: { 
    setView: (v: string) => void, 
    currentView: string, 
    user: Member | null,
    lang: LangCode,
    setLang: (l: LangCode) => void,
    theme: 'dark' | 'light',
    toggleTheme: () => void
}) => {
  const t = translations[lang].nav;
  const links = [
    { id: 'nexus', label: t.nexus },
    { id: 'archives', label: t.archives },
    { id: 'verify', label: t.verify },
    { id: 'portal', label: user ? t.dashboard : t.portal },
  ];

  return (
    <nav className="border-b border-gray-300 dark:border-void-light bg-paper/90 dark:bg-void/90 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('nexus')}>
          <ChaosStarIcon />
          <span className="font-serif text-xl tracking-widest text-ink dark:text-gray-100 hidden md:block">
            THE ALLUNITY ORDER
          </span>
        </div>
        
        <div className="flex space-x-4 md:space-x-8 items-center">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => setView(link.id)}
              className={`text-xs md:text-sm font-mono tracking-widest transition-colors ${
                currentView === link.id 
                  ? 'text-neon font-bold drop-shadow-sm' 
                  : 'text-gray-500 hover:text-cyan dark:hover:text-cyan'
              }`}
            >
              [{link.label}]
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-4">
            <div className="flex space-x-2 font-mono text-xs">
                {(['EN', 'ZH', 'ES'] as LangCode[]).map((l) => (
                    <button 
                        key={l} 
                        onClick={() => setLang(l)}
                        className={`hover:text-neon transition-colors ${lang === l ? 'text-neon underline' : 'text-gray-500'}`}
                    >
                        {l}
                    </button>
                ))}
            </div>
            <button 
                onClick={toggleTheme} 
                className="text-gray-600 dark:text-gray-400 hover:text-neon transition-colors"
                title="Toggle Theme"
            >
                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
        </div>
      </div>
    </nav>
  );
};

const Hero = ({ setView, user, lang }: { setView: (v: string) => void, user: Member | null, lang: LangCode }) => {
    const t = translations[lang].hero;
    return (
        <div className="min-h-[85vh] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
            <div className="z-10 max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-serif text-ink dark:text-white mb-6 animate-glitch tracking-tighter">
                {t.title_1}<br /><span className="text-neon">{t.title_2}</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-mono mb-8 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
                {t.subtitle}
                <br/><br/>
                {t.join_text}
            </p>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 justify-center">
                <button
                onClick={() => setView('portal')}
                className="bg-neon text-black px-8 py-3 font-mono font-bold hover:bg-white transition-all duration-300 shadow-lg dark:shadow-none"
                >
                {user ? `${t.btn_access} [${user.codename}]` : t.btn_login}
                </button>
                <button
                onClick={() => setView('nexus_details')} 
                className="border border-gray-400 dark:border-gray-600 text-gray-600 dark:text-gray-400 px-8 py-3 font-mono hover:border-cyan hover:text-cyan transition-all duration-300"
                >
                {t.btn_manifesto}
                </button>
            </div>
            </div>
        </div>
    );
};

const Manifesto = ({ lang }: { lang: LangCode }) => {
    const t = translations[lang].manifesto;
    return (
        <div className="max-w-3xl mx-auto py-16 px-6 animate-fadeIn">
            <h2 className="text-3xl font-serif text-cyan mb-8 border-b border-gray-300 dark:border-gray-800 pb-2">{t.title}</h2>
            <div className="prose prose-lg font-serif text-gray-700 dark:text-gray-300">
                <p>{t.p1}</p>
                <p>{t.p2}</p>
                <blockquote className="border-l-4 border-neon pl-4 italic text-gray-500 dark:text-gray-400 my-8 bg-gray-100 dark:bg-void-light/50 p-4">
                    {t.quote}
                </blockquote>
                <p>{t.p3}</p>
            </div>
        </div>
    );
};

interface CommentItemProps {
    comment: Comment;
    user: Member | null;
    lang: LangCode;
    articleId: string;
    onUpdate: () => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
    comment, 
    user, 
    lang, 
    articleId, 
    onUpdate 
}) => {
    const [replying, setReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const t = translations[lang].archives;

    const handleLike = async () => {
        if(!user) return;
        await db.likeComment(articleId, comment.id);
        onUpdate();
    };

    const handleDelete = async () => {
        if(window.confirm('Delete this comment?')) {
            await db.deleteComment(articleId, comment.id);
            onUpdate();
        }
    };

    const handleReply = async () => {
        if(!user || !replyContent.trim()) return;
        await db.addComment(articleId, {
            id: Date.now().toString(),
            author: user.codename,
            date: formatDate(),
            content: replyContent,
            likes: 0,
            replies: []
        }, comment.id);
        setReplyContent('');
        setReplying(false);
        onUpdate();
    };

    const isAdmin = user?.rank === MemberRank.ARCHITECT;
    const isAuthor = user?.codename === comment.author;

    return (
        <div className="mb-4">
            <div className="bg-gray-100 dark:bg-void-light/30 p-4 border-l-2 border-gray-300 dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-cyan font-mono text-sm font-bold">{comment.author}</span>
                    <span className="text-xs text-gray-500 font-mono">{comment.date}</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">{comment.content}</p>
                
                <div className="flex gap-4 text-xs font-mono text-gray-500">
                    <button onClick={handleLike} className="hover:text-neon flex items-center gap-1">
                        <HeartIcon /> {comment.likes > 0 && comment.likes} {t.like}
                    </button>
                    {user && (
                        <button onClick={() => setReplying(!replying)} className="hover:text-white">
                           {t.reply}
                        </button>
                    )}
                    {(isAdmin || isAuthor) && (
                        <button onClick={handleDelete} className="text-crimson hover:underline">
                           {t.delete}
                        </button>
                    )}
                </div>

                {replying && (
                    <div className="mt-4 flex gap-2">
                        <input 
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={t.reply_placeholder}
                            className="flex-1 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 p-2 text-ink dark:text-white text-xs outline-none"
                        />
                        <button onClick={handleReply} className="bg-neon text-black px-3 py-1 text-xs font-bold">{t.reply}</button>
                        <button onClick={() => setReplying(false)} className="text-gray-500 text-xs px-2">{t.cancel}</button>
                    </div>
                )}
            </div>
            
            {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 mt-2 border-l border-gray-300 dark:border-gray-800 pl-4">
                    {comment.replies.map(reply => (
                        <CommentItem 
                            key={reply.id} 
                            comment={reply} 
                            user={user} 
                            lang={lang} 
                            articleId={articleId} 
                            onUpdate={onUpdate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const Archives = ({ lang, user }: { lang: LangCode, user: Member | null }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [reading, setReading] = useState<Article | null>(null);
  const [newComment, setNewComment] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const t = translations[lang].archives;

  useEffect(() => {
    const loadArticles = async () => {
      const raw = await db.getArticles();
      let sorted = [...raw].sort((a, b) => {
          if (a.isPinned === b.isPinned) return 0;
          return a.isPinned ? -1 : 1;
      });

      if (selectedAuthor) {
          sorted = sorted.filter(a => a.author === selectedAuthor);
      }

      setArticles(sorted);
    };
    loadArticles();
  }, [reading, selectedAuthor]); 

  const handlePostComment = async () => {
      if(!user || !reading || !newComment.trim()) return;
      await db.addComment(reading.id, {
          id: Date.now().toString(),
          author: user.codename,
          date: formatDate(),
          content: newComment,
          likes: 0,
          replies: []
      });
      setNewComment('');
      const articles = await db.getArticles();
      const updatedArticle = articles.find((a: Article) => a.id === reading.id);
      if(updatedArticle) setReading(updatedArticle);
  };

  const handleRefresh = async () => {
      if(reading) {
          const articles = await db.getArticles();
          const updatedArticle = articles.find((a: Article) => a.id === reading.id);
          if(updatedArticle) {
              // Force a state update by creating a new object
              setReading({...updatedArticle});
          }
      }
  };

  const handleAuthorClick = (e: React.MouseEvent, author: string) => {
      e.stopPropagation();
      setReading(null);
      setSelectedAuthor(author);
  };

  if (reading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 animate-fadeIn">
        <button onClick={() => setReading(null)} className="text-cyan mb-6 font-mono hover:underline flex items-center gap-2">
           &larr; {t.back}
        </button>
        <article className="prose prose-lg dark:prose-invert">
          <div className="flex items-center gap-2">
             {reading.isPinned && <span className="bg-neon text-black text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1"><PinIcon filled /> {t.pinned}</span>}
             <h1 className="font-serif text-4xl mb-2 text-ink dark:text-white leading-tight mt-2">{reading.title}</h1>
          </div>
          
          <div className="flex flex-wrap gap-y-2 items-center text-xs font-mono text-gray-500 mb-8 border-b border-gray-300 dark:border-gray-800 pb-4">
            <span 
                className="mr-4 text-neon cursor-pointer hover:underline hover:text-white transition-colors"
                onClick={(e) => handleAuthorClick(e, reading.author)}
            >
                {t.author}: {reading.author}
            </span>
            <span className="mr-4">{t.date}: {reading.date}</span>
            <span className="px-2 py-0.5 border border-gray-400 dark:border-gray-700 rounded text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-void-light">{reading.type}</span>
          </div>
          
          <div className="font-serif leading-relaxed text-gray-800 dark:text-gray-300">
            {isMarkdown(reading.content) ? (
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {reading.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{reading.content}</div>
            )}
          </div>

          {reading.type === ArticleType.PDF && (
            <div className="mt-8 p-6 border border-dashed border-gray-400 dark:border-gray-700 text-center bg-gray-100 dark:bg-void-light rounded-sm">
              <p className="mb-4 text-gray-500 dark:text-gray-400 font-mono text-sm">{t.secure_container}</p>
              <button className="bg-gray-800 hover:bg-neon hover:text-black text-white px-6 py-3 font-mono text-sm transition-all flex items-center justify-center mx-auto gap-2">
                 <LockIcon /> {t.download}
              </button>
            </div>
          )}
        </article>

        <div className="mt-16 pt-8 border-t border-gray-300 dark:border-gray-800">
            <h3 className="text-xl font-mono text-ink dark:text-white mb-6 flex items-center gap-2">
                <span className="text-neon">//</span> {t.comments}
            </h3>
            
            <div className="space-y-6 mb-8">
                {(!reading.comments || reading.comments.length === 0) && (
                    <p className="text-gray-500 italic text-sm">{t.no_comments}</p>
                )}
                {reading.comments?.map((comment) => (
                    <CommentItem 
                        key={comment.id}
                        comment={comment}
                        user={user}
                        lang={lang}
                        articleId={reading.id}
                        onUpdate={handleRefresh}
                    />
                ))}
            </div>

            {user ? (
                <div className="space-y-4">
                    <textarea 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={t.write_comment}
                        className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700 p-3 text-ink dark:text-white font-mono text-sm focus:border-neon outline-none min-h-[100px]"
                    />
                    <button onClick={handlePostComment} className="bg-ink dark:bg-white text-white dark:text-black px-6 py-2 font-mono text-sm font-bold hover:bg-neon dark:hover:bg-neon transition-colors">
                        {t.post_comment}
                    </button>
                </div>
            ) : (
                <div className="text-center p-4 bg-gray-100 dark:bg-void-light border border-gray-300 dark:border-gray-800">
                    <p className="text-sm font-mono text-gray-500">{t.login_to_comment}</p>
                </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="flex items-end justify-between mb-8 border-b border-gray-300 dark:border-gray-800 pb-4">
          <div className="flex flex-col">
            <h2 className="text-3xl font-serif text-ink dark:text-white">
                {t.title}
            </h2>
            {selectedAuthor && (
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-neon font-mono text-sm">{t.works_of} {selectedAuthor}</span>
                    <button 
                        onClick={() => setSelectedAuthor(null)} 
                        className="text-[10px] border border-gray-600 px-2 rounded hover:bg-gray-800 hover:text-white"
                    >
                        {t.show_all}
                    </button>
                </div>
            )}
          </div>
          <span className="text-xs font-mono text-gray-500">{articles.length} {t.records_found}</span>
      </div>
      
      <div className="grid gap-4">
        {articles.length === 0 && <p className="text-gray-600 font-mono text-center py-12">{t.empty}</p>}
        {articles.map((article) => (
          <div
            key={article.id}
            onClick={() => setReading(article)}
            className={`group border p-6 cursor-pointer transition-all bg-white dark:bg-void-light/30 shadow-sm dark:shadow-none relative overflow-hidden ${
                article.isPinned 
                ? 'border-neon/50 bg-neon/5' 
                : 'border-gray-300 dark:border-gray-800 hover:border-neon dark:hover:border-neon'
            }`}
          >
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity text-black dark:text-white">
                <ChaosStarIcon />
            </div>
            
            <div className="flex justify-between items-start mb-3 relative z-10">
              <div className="flex flex-col gap-1">
                {article.isPinned && (
                    <span className="text-[10px] text-neon font-bold tracking-widest flex items-center gap-1">
                        <PinIcon filled /> {t.pinned}
                    </span>
                )}
                <h3 className="text-xl text-ink dark:text-gray-200 group-hover:text-neon transition-colors font-serif tracking-wide">
                    {article.title}
                </h3>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-500 font-mono mb-4 line-clamp-2 relative z-10">
              {article.content.substring(0, 160)}...
            </p>
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-600 font-mono relative z-10">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${article.type === 'PDF' ? 'bg-crimson' : 'bg-cyan'}`}></span>
                <span>{article.type}</span>
                <span 
                    className="hover:text-neon cursor-pointer z-20"
                    onClick={(e) => handleAuthorClick(e, article.author)}
                >
                    {t.author}: {article.author}
                </span>
              </div>
              <div className="flex items-center gap-4">
                {article.comments && article.comments.length > 0 && <span>{article.comments.length} MSG</span>}
                <span>{article.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Verifier = ({ lang }: { lang: LangCode }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<Member | null | 'NOT_FOUND'>('NOT_FOUND');
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = translations[lang].verifier;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!query) return;
    setLoading(true);
    setSearched(false);
    
    setTimeout(async () => {
      const member = await db.getMemberById(query.trim());
      setResult(member || 'NOT_FOUND');
      setSearched(true);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="max-w-xl mx-auto py-20 px-4 text-center">
      <div className="mb-12">
        <h2 className="text-2xl font-mono text-cyan mb-2">{t.title}</h2>
        <p className="text-gray-500 text-sm">{t.subtitle}</p>
      </div>

      <form onSubmit={handleVerify} className="relative mb-12">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.placeholder}
          className="w-full bg-white dark:bg-black border-b-2 border-gray-300 dark:border-gray-700 text-center text-2xl py-2 text-ink dark:text-white focus:outline-none focus:border-neon font-mono uppercase tracking-widest placeholder-gray-400 dark:placeholder-gray-800 transition-colors"
        />
        <button
          type="submit"
          className="mt-8 bg-gray-100 dark:bg-void-light border border-gray-300 dark:border-gray-700 px-8 py-2 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:border-neon transition-all font-mono text-sm uppercase tracking-widest"
        >
          {loading ? t.btn_scan : t.btn_exec}
        </button>
      </form>

      {searched && (
        <div className={`border p-8 relative animate-fadeIn bg-white dark:bg-void-light/30 shadow-lg dark:shadow-none ${result !== 'NOT_FOUND' && result !== null && result.active ? 'border-neon' : 'border-crimson'}`}>
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 bg-paper dark:bg-void font-mono text-sm ${result !== 'NOT_FOUND' && result !== null && result.active ? 'text-neon' : 'text-crimson'}`}>
            {t.result_title}
          </div>
          
          {result === 'NOT_FOUND' || result === null ? (
            <div className="text-crimson font-mono">
              [ {t.error} ]<br/>
              {t.error_desc}
            </div>
          ) : (
            <div className="text-left font-mono space-y-4">
              <div className="flex justify-center mb-6">
                 {result.photoUrl ? (
                     <div className="relative">
                        <img src={result.photoUrl} alt="Subject" className="w-32 h-32 object-cover grayscale contrast-125 border border-gray-700" />
                        <div className="absolute inset-0 border border-neon/50 pointer-events-none"></div>
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neon"></div>
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neon"></div>
                     </div>
                 ) : (
                     <div className="w-32 h-32 border border-dashed border-gray-400 dark:border-gray-700 flex items-center justify-center bg-gray-100 dark:bg-black">
                         <UserIcon />
                     </div>
                 )}
              </div>

              <div className="flex justify-between border-b border-gray-300 dark:border-gray-800 pb-2">
                <span className="text-gray-500">{t.status}</span>
                <span className={result.active ? "text-neon" : "text-crimson"}>
                  {result.active ? t.active : t.excommunicated}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t.name}</span>
                <span className="text-ink dark:text-white">{result.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t.codename}</span>
                <span className="text-cyan">{result.codename}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">EMAIL</span>
                <span className="text-gray-600 dark:text-gray-300 break-all ml-4">{result.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t.rank}</span>
                <span className="text-ink dark:text-white">{result.rank}</span>
              </div>
              <div className="pt-4 text-xs text-gray-600 border-t border-gray-300 dark:border-gray-800">
                 {t.notes}: {result.notes || t.no_notes}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Portal = ({ user, setUser, lang }: { user: Member | null, setUser: (u: Member | null) => void, lang: LangCode }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formState, setFormState] = useState({ id: '', password: '', name: '', codename: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const t = translations[lang].portal;

  const [adminTab, setAdminTab] = useState<'INDUCT' | 'MANAGE'>('INDUCT');
  const [newMember, setNewMember] = useState<Partial<Member>>({ rank: MemberRank.INITIATE, active: true });
  const [newArticle, setNewArticle] = useState<Partial<Article>>({ type: ArticleType.TEXT, tags: [] });
  const [msg, setMsg] = useState('');
  const [manageMembers, setManageMembers] = useState<Member[]>([]);
  const [manageArticles, setManageArticles] = useState<Article[]>([]);

  useEffect(() => {
      if(user?.rank === MemberRank.ARCHITECT && adminTab === 'MANAGE') {
          refreshLists();
      }
  }, [user, adminTab]);

  const refreshLists = async () => {
      const members = await db.getMembers();
      const articles = await db.getArticles();
      setManageMembers([...members]);
      setManageArticles([...articles]);
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (isLogin) {
        if (!formState.id || !formState.password) {
             setError('ID and Password are required.');
             return;
        }

        const member = await db.authenticateUser(formState.id, formState.password);
        
        if (member) {
            setUser(member);
        } else {
            setError('Invalid Credentials. Access Denied.');
        }
    } else {
        // Registration
        if (!formState.name || !formState.codename || !formState.password) {
            setError('All fields including Password are required.');
            return;
        }
        
        const generatedId = `AO-${Math.floor(Math.random() * 9000) + 1000}-GST`;
        const newUser: Member = {
            id: generatedId,
            name: formState.name,
            codename: formState.codename,
            password: formState.password,
            email: 'pending@verify.com',
            rank: MemberRank.INITIATE,
            active: true,
            joinedDate: new Date().toISOString().split('T')[0],
            notes: 'Self-initiated via Portal.'
        };
        await db.addMember(newUser);
        setSuccessMsg(`Registration Successful. Your ID is: ${generatedId}. Please save this ID to login.`);
        setIsLogin(true); // Switch to login view
        setFormState({ ...formState, id: generatedId }); // Auto fill id for convenience
    }
  };

  const handleLogout = () => {
      setUser(null);
      setFormState({ id: '', password: '', name: '', codename: '' });
  };

  const submitMember = async () => {
    if (!newMember.name || !newMember.id) return;
    await db.addMember({
      ...newMember,
      joinedDate: newMember.joinedDate || new Date().toISOString().split('T')[0],
      active: newMember.active !== undefined ? newMember.active : true,
    } as Member);
    setMsg(t.msg_member_added);
    setNewMember({ rank: MemberRank.INITIATE, active: true, id: '', name: '', codename: '', email: '', photoUrl: '' });
    setTimeout(() => setMsg(''), 3000);
    refreshLists();
  };

  const submitArticle = async () => {
    if (!newArticle.title) return;
    await db.addArticle({
      ...newArticle,
      id: newArticle.id || `DOC-${Math.floor(Math.random() * 1000)}`,
      date: newArticle.date || new Date().toISOString().split('T')[0],
      tags: newArticle.tags || [],
    } as Article);
    setMsg(t.msg_article_added);
    setNewArticle({ type: ArticleType.TEXT, tags: [], title: '', author: '', content: '' });
    setTimeout(() => setMsg(''), 3000);
    refreshLists();
  };

  const handleEditMember = (member: Member) => {
      setNewMember(member);
      setAdminTab('INDUCT');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteMember = (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Prevent deleting self or seed admin
      if (id === 'AO-000-ALPHA' || (user && id === user.id)) {
          alert("Cannot delete the Root Architect or your own active account.");
          return;
      }

      if(window.confirm(`Permanently delete member ${id}?`)) {
          (async () => {
              const success = await db.deleteMember(id);
              if (success) {
                  alert(t.msg_delete_success);
                  await refreshLists();
              } else {
                  alert(t.msg_delete_fail);
              }
          })();
      }
  };

  const handleEditArticle = (article: Article) => {
      setNewArticle(article);
      setAdminTab('INDUCT');
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteArticle = (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      if(window.confirm(`Permanently delete article ${id}?`)) {
          (async () => {
              const success = await db.deleteArticle(id);
              if (success) {
                  alert(t.msg_delete_success);
                  await refreshLists();
              } else {
                   alert(t.msg_delete_fail);
              }
          })();
      }
  };

  const handleTogglePin = async (id: string) => {
      // Toggle logic usually doesn't need full refresh but to be safe let's sync
      await db.togglePinArticle(id);
      await refreshLists();
  };

  if (user) {
      const isAdmin = user.rank === MemberRank.ARCHITECT;
      return (
          <div className="max-w-5xl mx-auto py-12 px-4 animate-fadeIn">
              <div className="flex justify-between items-center mb-8 border-b border-gray-300 dark:border-gray-800 pb-4">
                  <div>
                      <h2 className="text-2xl font-serif text-ink dark:text-white">{t.welcome}, {user.codename.toUpperCase()}</h2>
                      <p className="font-mono text-xs text-neon mt-1">{t.rank}: {user.rank.toUpperCase()} // ID: {user.id}</p>
                  </div>
                  <button onClick={handleLogout} className="text-crimson font-mono text-xs hover:underline">[ {t.disconnect} ]</button>
              </div>

              {msg && <div className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-3 mb-6 font-mono text-center border border-green-300 dark:border-green-900 text-sm">{msg}</div>}

              {isAdmin ? (
                  <>
                    <div className="flex gap-4 mb-6">
                        <button 
                            onClick={() => setAdminTab('INDUCT')}
                            className={`px-4 py-2 font-mono text-sm border ${adminTab === 'INDUCT' ? 'border-neon text-neon bg-neon/10' : 'border-gray-500 text-gray-500'}`}
                        >
                            {t.tab_induction}
                        </button>
                        <button 
                            onClick={() => setAdminTab('MANAGE')}
                            className={`px-4 py-2 font-mono text-sm border ${adminTab === 'MANAGE' ? 'border-neon text-neon bg-neon/10' : 'border-gray-500 text-gray-500'}`}
                        >
                            {t.tab_registry}
                        </button>
                    </div>

                    {adminTab === 'INDUCT' ? (
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="border border-gray-300 dark:border-gray-800 p-6 bg-white dark:bg-void-light shadow-sm dark:shadow-none">
                                <h3 className="text-neon font-mono mb-4 border-b border-gray-300 dark:border-gray-800 pb-2">{t.add_member}</h3>
                                <div className="space-y-4">
                                    <input placeholder={t.ph_cert_id} className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 text-ink dark:text-white font-mono text-sm" value={newMember.id || ''} onChange={e => setNewMember({...newMember, id: e.target.value})} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input placeholder={t.ph_real_name} className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 text-ink dark:text-white font-mono text-sm" value={newMember.name || ''} onChange={e => setNewMember({...newMember, name: e.target.value})} />
                                        <input placeholder={t.ph_codename} className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 text-ink dark:text-white font-mono text-sm" value={newMember.codename || ''} onChange={e => setNewMember({...newMember, codename: e.target.value})} />
                                    </div>
                                    <input type="password" placeholder={t.placeholder_pass} className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 text-ink dark:text-white font-mono text-sm" value={newMember.password || ''} onChange={e => setNewMember({...newMember, password: e.target.value})} />
                                    <input placeholder={t.ph_email} className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 text-ink dark:text-white font-mono text-sm" value={newMember.email || ''} onChange={e => setNewMember({...newMember, email: e.target.value})} />
                                    <input placeholder={t.ph_photo} className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 text-ink dark:text-white font-mono text-sm" value={newMember.photoUrl || ''} onChange={e => setNewMember({...newMember, photoUrl: e.target.value})} />
                                    <select className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 text-ink dark:text-white font-mono text-sm" value={newMember.rank} onChange={e => setNewMember({...newMember, rank: e.target.value as MemberRank})}>
                                    {Object.values(MemberRank).map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                    <textarea placeholder={t.ph_notes} className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 text-ink dark:text-white font-mono text-sm h-20" value={newMember.notes || ''} onChange={e => setNewMember({...newMember, notes: e.target.value})} />
                                    <button onClick={submitMember} className="w-full bg-gray-800 hover:bg-neon hover:text-black text-white p-2 font-mono transition-colors">{t.btn_induct}</button>
                                </div>
                            </div>
                            <div className="border border-gray-300 dark:border-gray-800 p-6 bg-white dark:bg-void-light shadow-sm dark:shadow-none">
                                <h3 className="text-cyan font-mono mb-4 border-b border-gray-300 dark:border-gray-800 pb-2">{t.publish_doc}</h3>
                                <div className="space-y-4">
                                    <input placeholder={t.ph_title} className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 text-ink dark:text-white font-mono text-sm" value={newArticle.title || ''} onChange={e => setNewArticle({...newArticle, title: e.target.value})} />
                                    <input placeholder={t.ph_author} className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 text-ink dark:text-white font-mono text-sm" value={newArticle.author || ''} onChange={e => setNewArticle({...newArticle, author: e.target.value})} />
                                    <select className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 text-ink dark:text-white font-mono text-sm" value={newArticle.type} onChange={e => setNewArticle({...newArticle, type: e.target.value as ArticleType})}>
                                    {Object.values(ArticleType).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <textarea placeholder={t.ph_content} className="w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 p-2 text-ink dark:text-white font-mono text-sm h-32" value={newArticle.content || ''} onChange={e => setNewArticle({...newArticle, content: e.target.value})} />
                                    <button onClick={submitArticle} className="w-full bg-gray-800 hover:bg-cyan hover:text-black text-white p-2 font-mono transition-colors">{t.btn_upload}</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-8">
                             <div className="border border-gray-300 dark:border-gray-800 p-6 bg-white dark:bg-void-light">
                                <h3 className="text-neon font-mono mb-4">{t.manage_members}</h3>
                                <div className="md:hidden space-y-4">
                                    {manageMembers.map(m => (
                                        <div key={m.id} className="border border-gray-300 dark:border-gray-700 p-4 bg-gray-50 dark:bg-black rounded-sm relative">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="text-ink dark:text-white font-bold font-serif">{m.codename}</div>
                                                    <div className="text-gray-500 text-xs font-mono">{m.id}</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={() => handleEditMember(m)} className="z-10 bg-cyan/10 text-cyan text-xs border border-cyan px-3 py-2 hover:bg-cyan hover:text-black">{t.edit}</button>
                                                    <button type="button" onClick={(e) => handleDeleteMember(e, m.id)} className="z-10 bg-crimson/10 text-crimson text-xs border border-crimson px-3 py-2 hover:bg-crimson hover:text-white">{t.delete}</button>
                                                </div>
                                            </div>
                                            <div className="text-cyan text-xs font-mono">{m.rank}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-sm font-mono text-left">
                                        <thead>
                                            <tr className="border-b border-gray-300 dark:border-gray-700 text-gray-500">
                                                <th className="p-2">ID</th>
                                                <th className="p-2">CODENAME</th>
                                                <th className="p-2">RANK</th>
                                                <th className="p-2 text-right">ACTION</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {manageMembers.map(m => (
                                                <tr key={m.id} className="border-b border-gray-300 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-void">
                                                    <td className="p-2 text-gray-600 dark:text-gray-400">{m.id}</td>
                                                    <td className="p-2 text-ink dark:text-white">{m.codename}</td>
                                                    <td className="p-2 text-cyan">{m.rank}</td>
                                                    <td className="p-2 text-right space-x-2">
                                                        <button type="button" onClick={() => handleEditMember(m)} className="text-cyan hover:underline">{t.edit}</button>
                                                        <button type="button" onClick={(e) => handleDeleteMember(e, m.id)} className="text-crimson hover:underline font-bold">{t.delete}</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                             </div>
                             <div className="border border-gray-300 dark:border-gray-800 p-6 bg-white dark:bg-void-light">
                                <h3 className="text-cyan font-mono mb-4">{t.manage_articles}</h3>
                                <div className="md:hidden space-y-4">
                                    {manageArticles.map(a => (
                                        <div key={a.id} className="border border-gray-300 dark:border-gray-700 p-4 bg-gray-50 dark:bg-black rounded-sm relative">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1 mr-2">
                                                    <div className="text-ink dark:text-white font-bold font-serif line-clamp-1">{a.title}</div>
                                                    <div className="text-gray-500 text-xs font-mono">{a.date}</div>
                                                </div>
                                                <div className="flex flex-col gap-2 items-end">
                                                    <button onClick={() => handleTogglePin(a.id)} className={`relative z-10 text-[10px] px-2 py-1 border text-center ${a.isPinned ? 'border-neon text-neon' : 'border-gray-500 text-gray-500'}`}>{a.isPinned ? t.unpin : t.pin}</button>
                                                    <div className="flex gap-2">
                                                        <button type="button" onClick={() => handleEditArticle(a)} className="relative z-10 bg-cyan/10 text-cyan text-[10px] border border-cyan px-2 py-1 hover:bg-cyan hover:text-black">{t.edit}</button>
                                                        <button type="button" onClick={(e) => handleDeleteArticle(e, a.id)} className="relative z-10 bg-crimson/10 text-crimson text-[10px] border border-crimson px-2 py-1 hover:bg-crimson hover:text-white">{t.delete}</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-sm font-mono text-left">
                                        <thead>
                                            <tr className="border-b border-gray-300 dark:border-gray-700 text-gray-500">
                                                <th className="p-2">TITLE</th>
                                                <th className="p-2">DATE</th>
                                                <th className="p-2">PINNED</th>
                                                <th className="p-2 text-right">ACTION</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {manageArticles.map(a => (
                                                <tr key={a.id} className="border-b border-gray-300 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-void">
                                                    <td className="p-2 text-ink dark:text-white truncate max-w-[200px]">{a.title}</td>
                                                    <td className="p-2 text-gray-600 dark:text-gray-400">{a.date}</td>
                                                    <td className="p-2"><button onClick={() => handleTogglePin(a.id)} className={`relative z-10 text-xs px-2 py-1 border ${a.isPinned ? 'border-neon text-neon' : 'border-gray-500 text-gray-500'}`}>{a.isPinned ? t.unpin : t.pin}</button></td>
                                                    <td className="p-2 text-right space-x-2">
                                                        <button type="button" onClick={() => handleEditArticle(a)} className="text-cyan hover:underline">{t.edit}</button>
                                                        <button type="button" onClick={(e) => handleDeleteArticle(e, a.id)} className="text-crimson hover:underline font-bold">{t.delete}</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                             </div>
                        </div>
                    )}
                  </>
              ) : (
                  <div className="max-w-xl mx-auto border border-neon p-8 text-center animate-fadeIn bg-white dark:bg-void-light/50 shadow-sm dark:shadow-none">
                      <ChaosStarIcon />
                      <div className="mt-4 font-mono text-sm text-gray-500">{t.verified_msg}</div>
                      <h3 className="text-3xl font-serif text-ink dark:text-white mt-4">{user.name}</h3>
                      <div className="text-neon mt-2">{user.id}</div>
                      <div className="mt-8 pt-8 border-t border-gray-300 dark:border-gray-800 text-xs text-gray-500">{t.verified_desc}</div>
                  </div>
              )}
          </div>
      );
  }

  return (
      <div className="max-w-md mx-auto py-20 px-4 animate-fadeIn">
          <div className="text-center mb-12">
             <h2 className="text-2xl font-mono text-ink dark:text-white mb-2">{isLogin ? t.title_login : t.title_init}</h2>
             <p className="text-gray-500 text-xs">{t.secure}</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-6">
              {error && <div className="text-crimson text-xs font-mono text-center border border-crimson p-2">{error}</div>}
              {successMsg && <div className="text-neon text-xs font-mono text-center border border-neon p-2">{successMsg}</div>}
              
              {!isLogin && (
                 <>
                    <input placeholder={t.placeholder_name} className="w-full bg-white dark:bg-black border-b border-gray-300 dark:border-gray-700 py-2 text-center text-ink dark:text-white focus:outline-none focus:border-neon font-mono text-sm" value={formState.name} onChange={e => setFormState({...formState, name: e.target.value})} />
                    <input placeholder={t.placeholder_code} className="w-full bg-white dark:bg-black border-b border-gray-300 dark:border-gray-700 py-2 text-center text-ink dark:text-white focus:outline-none focus:border-neon font-mono text-sm" value={formState.codename} onChange={e => setFormState({...formState, codename: e.target.value})} />
                 </>
              )}
              
              {isLogin && <input placeholder={t.placeholder_id} className="w-full bg-white dark:bg-black border-b border-gray-300 dark:border-gray-700 py-2 text-center text-ink dark:text-white focus:outline-none focus:border-neon font-mono text-sm uppercase" value={formState.id} onChange={e => setFormState({...formState, id: e.target.value})} />}
              
              <input type="password" placeholder={t.placeholder_pass} className="w-full bg-white dark:bg-black border-b border-gray-300 dark:border-gray-700 py-2 text-center text-ink dark:text-white focus:outline-none focus:border-neon font-mono text-sm" value={formState.password} onChange={e => setFormState({...formState, password: e.target.value})} />
              
              <button className="w-full bg-ink dark:bg-white text-white dark:text-black font-bold font-mono py-3 hover:bg-neon dark:hover:bg-neon transition-colors">{isLogin ? t.btn_auth : t.btn_submit}</button>
          </form>
          <div className="mt-8 text-center">
              <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }} className="text-gray-600 dark:text-gray-400 text-xs font-mono hover:text-black dark:hover:text-white">{isLogin ? t.link_req : t.link_ret}</button>
          </div>
      </div>
  );
};

const App = () => {
  const [view, setView] = useState('nexus');
  const [user, setUser] = useState<Member | null>(null);
  const [lang, setLang] = useState<LangCode>(() => (localStorage.getItem('taor_lang') as LangCode) || 'EN');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('taor_theme') as 'dark' | 'light') || 'dark');

  useEffect(() => {
    localStorage.setItem('taor_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('taor_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const renderView = () => {
    switch (view) {
      case 'nexus': return <Hero setView={setView} user={user} lang={lang} />;
      case 'nexus_details': return <Manifesto lang={lang} />;
      case 'archives': return <Archives lang={lang} user={user} />;
      case 'verify': return <Verifier lang={lang} />;
      case 'portal': return <Portal user={user} setUser={setUser} lang={lang} />;
      default: return <Hero setView={setView} user={user} lang={lang} />;
    }
  };

  return (
    <div className="min-h-screen bg-paper dark:bg-void text-ink dark:text-gray-200 selection:bg-neon selection:text-black transition-colors duration-300">
      <Navbar setView={setView} currentView={view} user={user} lang={lang} setLang={setLang} theme={theme} toggleTheme={toggleTheme} />
      <main>{renderView()}</main>
      <footer className="py-12 text-center border-t border-gray-300 dark:border-gray-900 mt-12 transition-colors duration-300">
        <div className="mb-6">
          <p className="text-[10px] font-mono text-gray-400 dark:text-gray-600 mb-2 uppercase tracking-widest">Cooperating Organizations</p>
          <a 
            href="http://hgwg.xyz/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm font-serif text-neon hover:text-cyan hover:underline transition-colors tracking-wide"
          >
            Hegui Magick Studio
          </a>
        </div>
        <p className="text-[10px] font-mono text-gray-500 dark:text-gray-700">
          THE ALLUNITY ORDER OF RESTRUCTURERS © {new Date().getFullYear()} <br/>
          All gods are one; the One becomes all.
        </p>
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);