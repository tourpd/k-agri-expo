export type SalesProduct = {
  id?: string;
  name: string;
  category?: string;
  crops?: string[];
  problems?: string[];
  reason?: string;
  selected?: boolean;
  detailUsage?: string;
  detailMethod?: string;
  detailTable?: string;
  detailWarning?: string;
};

export type ContentExpansion = {
  detailPageTitle: string;
  fourCutComic: string[];
  eightCutWebtoon: string[];
  shortsIdeas: string[];
  homeShoppingScript: string;
  reviewQuestions: string[];
};
