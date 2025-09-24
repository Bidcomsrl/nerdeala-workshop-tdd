import {IProduct} from "@/entity/IProduct";
import {IRetrieveManyProductsDTO} from "@/dto/ProductDTO";

export interface IProductRepository {
    retrieveMany(dto: IRetrieveManyProductsDTO): Promise<IProduct[]>
}