export interface IDashboardStats {
  totalBooks: number;
  totalUsers: number;
  pendingReviews: number;
}

export interface IDashboardGenreData {
  name: string;
  value: number;
}

export interface IDashboardCharts {
  genreData: IDashboardGenreData[];
}

