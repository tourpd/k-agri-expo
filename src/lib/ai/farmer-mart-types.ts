export type FarmerMartSourceInput = {
  homepageUrl?: string;
  youtubeUrl?: string;
  blogUrl?: string;
  cafeUrl?: string;
  storeUrl?: string;
  productImageUrls?: string[];
  memo?: string;
};

export type FarmerMartProduct = {
  productName: string;
  category: string;
  targetCrops: string[];
  farmerProblem: string;
  keyBenefits: string[];
  usageSummary: string;
  sellingPoint: string;
  evidenceNeeded: string[];
  confidence: number;
};

export type FarmerMartResult = {
  brandSummary: string;
  farmerProblems: string[];
  allProducts: FarmerMartProduct[];
  martPage: {
    title: string;
    subtitle: string;
    heroCopy: string;
    sections: string[];
    ctaText: string;
  };
  nextQuestions: string[];
};
