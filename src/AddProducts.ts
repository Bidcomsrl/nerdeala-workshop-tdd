import {IProduct} from "@/entity/IProduct";
import {IAddProductsDTO, IProductReferenceDTO} from "@/dto/ProductDTO";
import {IProductRepository} from "@/adapters/IProductRepository";
import {CrossWarehouseException, MaxQuantityExceededException, StockNotEnoughException} from "@/exceptions/exceptions";

export class AddProducts {
    private readonly maxQuantityPerProduct = 10;
    constructor(private productRepository: IProductRepository) {
    }

    async execute(dto: IAddProductsDTO): Promise<IProduct[]> {
        const references = this.reduceProductReferences(dto.products);
        const products = await this.productRepository.retrieveMany({
            skus: Array.from(references.keys()),
        });

        this.validateProducts(products, references);

        return products;
    }

    private reduceProductReferences(products: IProductReferenceDTO[]): Map<string, number> {
        const map = new Map<string, number>();

        for (const product of products) {
            let quantity = map.get(product.sku);

            if (quantity !== undefined) {
                quantity += product.quantity;
            } else {
                quantity = product.quantity;
            }

            if (quantity > this.maxQuantityPerProduct) {
                throw new MaxQuantityExceededException(`Product ${product.sku} exceeds the maximum quantity allowed`);
            }

            map.set(product.sku, product.quantity);
        }

        return map;
    }

    private validateProducts(products: IProduct[], references: Map<string, number>): void {
        for (const product of products) {
            const quantity = references.get(product.sku)!;

            if (product.stock < quantity) {
                throw new StockNotEnoughException(`Product ${product.sku} has not stock`);
            }

            if (products[0].warehouse !== product.warehouse) {
                throw new CrossWarehouseException(`Product ${product.sku} is not in the same warehouse`);
            }
        }
    }
}