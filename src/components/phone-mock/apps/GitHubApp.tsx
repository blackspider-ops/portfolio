'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface GitHubAppProps {
  onClose: () => void;
}

interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
}

interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
}

export function GitHubApp({ onClose }: GitHubAppProps) {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');

  useEffect(() => {
    async function fetchGitHubData() {
      try {
        const supabase = createClient();
        const { data: settings } = await supabase
          .from('site_settings')
          .select('social_links')
          .single();

        const socialLinks = settings?.social_links as { github?: string } | null;
        const githubUrl = socialLinks?.github || '';
        const extractedUsername = githubUrl.split('/').pop() || '';
        setUsername(extractedUsername);

        if (extractedUsername) {
          const [userRes, reposRes] = await Promise.all([
            fetch(`https://api.github.com/users/${extractedUsername}`),
            fetch(`https://api.github.com/users/${extractedUsername}/repos?sort=updated&per_page=10`),
          ]);

          if (userRes.ok) {
            setUser(await userRes.json());
          }
          if (reposRes.ok) {
            setRepos(await reposRes.json());
          }
        }
      } catch (err) {
        console.error('Error fetching GitHub data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchGitHubData();
  }, []);

  const languageColors: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f1e05a',
    Python: '#3572A5',
    Rust: '#dea584',
    Go: '#00ADD8',
    Java: '#b07219',
    CSS: '#563d7c',
    HTML: '#e34c26',
    Swift: '#ffac45',
    Kotlin: '#A97BFF',
  };

  return (
    <div className="h-full flex flex-col bg-[#0d1117]">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
        <button onClick={onClose} className="text-blue-400 text-sm">
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span className="text-white font-semibold">GitHub</span>
        </div>
        <div className="w-12" />
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Profile section */}
          {user && (
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-4">
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h2 className="text-white font-bold">{user.name}</h2>
                  <p className="text-white/50 text-sm">@{user.login}</p>
                </div>
              </div>
              {user.bio && (
                <p className="text-white/70 text-sm mt-3">{user.bio}</p>
              )}
              <div className="flex gap-6 mt-4">
                <div className="text-center">
                  <p className="text-white font-bold">{user.public_repos}</p>
                  <p className="text-white/50 text-xs">Repos</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold">{user.followers}</p>
                  <p className="text-white/50 text-xs">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold">{user.following}</p>
                  <p className="text-white/50 text-xs">Following</p>
                </div>
              </div>
              <a
                href={`https://github.com/${username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block w-full py-2.5 border border-white/20 rounded-lg text-white text-center text-sm font-medium"
              >
                View Profile
              </a>
            </div>
          )}

          {/* Repositories */}
          <div className="p-4">
            <h3 className="text-white/50 text-xs uppercase tracking-wider mb-3">Recent Repositories</h3>
            <div className="space-y-3">
              {repos.map((repo, index) => (
                <motion.a
                  key={repo.id}
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="block p-3 bg-white/5 rounded-xl border border-white/10"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="text-blue-400 font-medium text-sm">{repo.name}</h4>
                    <div className="flex items-center gap-3 text-white/50 text-xs">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
                        </svg>
                        {repo.stargazers_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 3a3 3 0 00-3 3v2.25a3 3 0 003 3h2.25a3 3 0 003-3V6a3 3 0 00-3-3H6zM15.75 3a3 3 0 00-3 3v2.25a3 3 0 003 3H18a3 3 0 003-3V6a3 3 0 00-3-3h-2.25zM6 12.75a3 3 0 00-3 3V18a3 3 0 003 3h2.25a3 3 0 003-3v-2.25a3 3 0 00-3-3H6zM17.625 13.5a.75.75 0 00-1.5 0v2.625H13.5a.75.75 0 000 1.5h2.625v2.625a.75.75 0 001.5 0v-2.625h2.625a.75.75 0 000-1.5h-2.625V13.5z"/>
                        </svg>
                        {repo.forks_count}
                      </span>
                    </div>
                  </div>
                  {repo.description && (
                    <p className="text-white/50 text-xs mt-1 line-clamp-2">{repo.description}</p>
                  )}
                  {repo.language && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: languageColors[repo.language] || '#8b8b8b' }}
                      />
                      <span className="text-white/50 text-xs">{repo.language}</span>
                    </div>
                  )}
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
