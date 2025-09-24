export interface IProductReferenceDTO {
    sku: string;
    quantity: number;
}

export interface IRetrieveManyProductsDTO {
    skus: string[];
}

export interface IAddProductsDTO {
    products: IProductReferenceDTO[];
}