import {AddProducts} from "@/AddProducts";
import {IAddProductsDTO, IProductReferenceDTO} from "@/dto/ProductDTO";
import {IProductRepository} from "@/adapters/IProductRepository";
import {CrossWarehouseException, MaxQuantityExceededException, StockNotEnoughException} from "@/exceptions/exceptions";
import {IProduct} from "@/entity/IProduct";

describe("AddProducts", () => {
    let addProducts: AddProducts;
    let productRepository: jest.Mocked<IProductRepository>;

    const productReferenceA: IProductReferenceDTO = {
        sku: "SKU1",
        quantity: 5,
    }

    const productReferenceB: IProductReferenceDTO = {
        sku: "SKU2",
        quantity: 2,
    }

    const productA: IProduct = {
        sku: 'SKU1',
        name: 'Test',
        price: 100,
        stock: 100,
        category: 'Test',
        brand: 'test',
        warehouse: 'Warehouse1',
    }
    const productB: IProduct = {
        sku: 'SKU2',
        name: 'Test',
        price: 100,
        stock: 100,
        category: 'Test',
        brand: 'test',
        warehouse: 'Warehouse1',
    }

    beforeEach(() => {
        productRepository = {
            retrieveMany: jest.fn(),
        } as jest.Mocked<IProductRepository>;

        addProducts = new AddProducts(productRepository);
    })

    it("should return a list of idempotent products when there are two equal products", async () => {
        // Arrange
        productRepository.retrieveMany.mockResolvedValue([productA]);
        const dto: IAddProductsDTO = {products: [productReferenceA, productReferenceA]};

        // Act
        const products = await addProducts.execute(dto);

        // Assert
        expect(products).toHaveLength(1);
        expect(products[0].sku).toEqual('SKU1');
        expect(productRepository.retrieveMany).toHaveBeenCalledWith({
            skus: ['SKU1'],
        });
    });
    it("should return a list of products when products are different", async () => {
        // Arrange
        productRepository.retrieveMany.mockResolvedValue([productA, productB]);
        const dto: IAddProductsDTO = {products: [productReferenceA, productReferenceB]};

        // Act
        const products = await addProducts.execute(dto);

        // Assert
        expect(products).toHaveLength(2);
        expect(products[0].sku).toEqual('SKU1');
        expect(products[1].sku).toEqual('SKU2');
        expect(productRepository.retrieveMany).toHaveBeenCalledWith({
            skus: ['SKU1', 'SKU2'],
        });
    });
    it("should throw an error when products have not stock", async () => {
        // Arrange
        productRepository.retrieveMany.mockResolvedValue([{...productA, stock: 0}]);
        const dto: IAddProductsDTO = {products: [productReferenceA]};

        // Act
        const result = addProducts.execute(dto);

        // Assert
        expect(result).rejects.toThrow(StockNotEnoughException);
    })
    it("should throw an error when products have not enough stock", async () => {
        // Arrange
        productRepository.retrieveMany.mockResolvedValue([{...productA, stock: 1}]);
        const dto: IAddProductsDTO = {products: [productReferenceA]};

        // Act
        const result = addProducts.execute(dto);

        // Assert
        expect(result).rejects.toThrow(StockNotEnoughException);
    })
    it("should throw an error when product exceeds the maximum quantity allowed", async () => {
        // Arrange
        productRepository.retrieveMany.mockResolvedValue([productA]);
        const dto: IAddProductsDTO = {products: [{...productReferenceA, quantity: 20}]};

        // Act
        const result = addProducts.execute(dto);

        // Assert
        await expect(result).rejects.toThrow(MaxQuantityExceededException);
    });
    it("should throw an error when products are in different warehouses", async () => {
        // Arrange
        productRepository.retrieveMany.mockResolvedValue([{...productA, warehouse: 'Warehouse2'}, productB]);
        const dto: IAddProductsDTO = {products: [productReferenceA, productReferenceB]};

        // Act
        const products = addProducts.execute(dto);

        // Assert
        expect(products).rejects.toThrow(CrossWarehouseException);
    });
    it("should return a list of products when all products reference belongs to the same warehouse", async () => {
        // Arrange
        productRepository.retrieveMany.mockResolvedValue([productA, productB]);
        const dto: IAddProductsDTO = {products: [productReferenceA, productReferenceB]}

        // Act
        const products = await addProducts.execute(dto);

        // Assert
        expect(products).toHaveLength(2);
        expect(products[0].sku).toEqual('SKU1');
        expect(products[1].sku).toEqual('SKU2');
    })
})