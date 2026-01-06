export type LibraryCategory = 'Frontend' | 'Backend' | 'Database' | 'Auth' | 'ORM';

export type Library = {
  id: string;
  name: string;
  category: LibraryCategory;
  vibe_score: number; // 0-100
  best_with: string[];
  friction_with: string[];
  npm_install: string;
  boilerplate_path: string;
};
