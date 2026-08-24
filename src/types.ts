export interface Video {
  guid: string;
  title: string;
  length: number;
  status: number;
  dateUploaded: string;
  availableResolutions: string;
  thumbnailCount: number;
  thumbnailFileName: string;
  hasPreviewAnimation: boolean;
  
  // Custom properties added by backend
  directPlayUrl: string;
  hlsPlaylistUrl: string;
  thumbnailUrl: string;
  previewAnimationUrl: string | null;
}

export interface SearchResponse {
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  items: Video[];
}
