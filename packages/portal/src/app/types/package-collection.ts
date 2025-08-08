
export enum Shift {
    MORNING = 'Manhã',
    AFTERNOON = 'Tarde',
    NIGHT = 'Noite',
  }
  
  export enum CollectionStatus {
    AWAITING_COLLECTION = 'A Aguardar Recolha',
    IN_TRANSIT = 'Em Trânsito',
    COMPLETED = 'Concluído',
  }
  

  export interface PackageCollectionFormData {
    id?: string;
    driver: string; 
    collectionDate: string;
    shift: Shift;
    selectedCollectionItems: string[];
  }
  
  export interface CollectionItemResponse {
    id: string;
    address: string;
    dayOfWeek: string;
    shift: Shift;
  }
  
  export interface PackageCollectionResponse {
    id: string;
    driver: string; 
    packageQty: number;
    status: CollectionStatus;
    collectionDate: string;
    shift: Shift;
    selectedCollectionItems: string[]; 
    createdAt: string;
    updatedAt: string;
    deletedAt: null | string;
  }
