export interface RouteSegment {
  label: string;
  href: string | null;
  isType: boolean;
}

export interface Item {
  id: string;
  href: string;
  type: 'blog' | 'wiki' | 'project';
  pinned: boolean;
  title: string;
  description: string;
  date: string;
  route: RouteSegment[];
}
