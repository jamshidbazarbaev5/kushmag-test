// Price type constants
export const SALES_PRICE_TYPE_ID = "0f4d57e2-f0b0-11ee-0a80-16ce00046acd";
export const WHOLESALE_PRICE_TYPE_ID = "6a3ceb22-dd31-11ef-0a80-028d0002a3b1";

// Price type names
export const SALES_PRICE_NAME = "Цена продажи";
export const WHOLESALE_PRICE_NAME = "Цена оптом";

export interface PriceType {
  meta: {
    href: string;
    type: string;
    mediaType: string;
  };
  id: string;
  name: string;
  externalCode: string;
}

export interface Currency {
  meta: {
    href: string;
    metadataHref: string;
    type: string;
    mediaType: string;
    uuidHref: string;
  };
}

export interface SalePrice {
  value: number;
  currency: Currency;
  priceType: PriceType;
}

export interface Product {
  id: string;
  accountId: string;
  name: string;
  meta: {
    href: string;
    type: string;
    mediaType: string;
  };
  salePrices: SalePrice[];
}

/**
 * Gets the sales price (Цена продажи) from a product's salePrices array
 * @param product - Product with salePrices array
 * @returns The sales price object or null if not found
 */
export const getSalesPrice = (product: Product): SalePrice | null => {
  if (!product?.salePrices?.length) {
    return null;
  }

  // First try to find by exact ID
  const salesPriceById = product.salePrices.find(
    (price: SalePrice) => price.priceType.id === SALES_PRICE_TYPE_ID
  );

  if (salesPriceById) {
    return salesPriceById;
  }

  // Fallback: try to find by name
  const salesPriceByName = product.salePrices.find(
    (price: SalePrice) =>
      price.priceType.name?.toLowerCase().includes("цена продажи") ||
      price.priceType.name?.toLowerCase().includes("sale") ||
      price.priceType.name?.toLowerCase().includes("retail")
  );

  return salesPriceByName || null;
};

/**
 * Gets the sales price type ID from a product
 * @param product - Product with salePrices array
 * @returns The sales price type ID or empty string if not found
 */
export const getSalesPriceTypeId = (product: Product): string => {
  const salesPrice = getSalesPrice(product);
  return salesPrice?.priceType?.id || "";
};

/**
 * Gets the sales price value from a product (converted from kopecks to rubles)
 * @param product - Product with salePrices array
 * @returns The sales price value in rubles or 0 if not found
 */
export const getSalesPriceValue = (product: Product): number => {
  const salesPrice = getSalesPrice(product);
  return salesPrice ? salesPrice.value / 100 : 0;
};

/**
 * Gets the wholesale price (Цена оптом) from a product's salePrices array
 * @param product - Product with salePrices array
 * @returns The wholesale price object or null if not found
 */
export const getWholesalePrice = (product: Product): SalePrice | null => {
  if (!product?.salePrices?.length) {
    return null;
  }

  // First try to find by exact ID
  const wholesalePriceById = product.salePrices.find(
    (price: SalePrice) => price.priceType.id === WHOLESALE_PRICE_TYPE_ID
  );

  if (wholesalePriceById) {
    return wholesalePriceById;
  }

  // Fallback: try to find by name
  const wholesalePriceByName = product.salePrices.find(
    (price: SalePrice) =>
      price.priceType.name?.toLowerCase().includes("цена оптом") ||
      price.priceType.name?.toLowerCase().includes("wholesale") ||
      price.priceType.name?.toLowerCase().includes("optom")
  );

  return wholesalePriceByName || null;
};

/**
 * Gets the default price type and value for a product (prioritizes sales price)
 * @param product - Product with salePrices array
 * @returns Object with priceTypeId and priceValue
 */
export const getDefaultPrice = (product: Product): { priceTypeId: string; priceValue: number } => {
  const salesPrice = getSalesPrice(product);

  if (salesPrice) {
    return {
      priceTypeId: salesPrice.priceType.id,
      priceValue: salesPrice.value / 100
    };
  }

  // Fallback to first available price if sales price not found
  const firstPrice = product?.salePrices?.[0];
  if (firstPrice) {
    return {
      priceTypeId: firstPrice.priceType.id,
      priceValue: firstPrice.value / 100
    };
  }

  return {
    priceTypeId: "",
    priceValue: 0
  };
};

/**
 * Sets the default price type for all products to "Цена продажи"
 * This function modifies the products in place to ensure sales price is the default
 * @param products - Array of products to modify
 * @returns Modified products array
 */
export const setDefaultSalesPriceType = (products: Product[]): Product[] => {
  return products.map(product => {
    if (!product.salePrices?.length) {
      return product;
    }

    // Find the sales price
    const salesPrice = getSalesPrice(product);

    if (salesPrice) {
      // Move sales price to the first position
      const otherPrices = product.salePrices.filter(
        price => price.priceType.id !== salesPrice.priceType.id
      );

      return {
        ...product,
        salePrices: [salesPrice, ...otherPrices]
      };
    }

    return product;
  });
};

/**
 * Gets price options for a select dropdown, with sales price first
 * @param product - Product with salePrices array
 * @returns Array of price options for dropdown
 */
export const getPriceOptions = (product: Product) => {
  if (!product?.salePrices?.length) {
    return [];
  }

  const salesPrice = getSalesPrice(product);
  const otherPrices = product.salePrices.filter(
    price => price.priceType.id !== salesPrice?.priceType.id
  );

  const options = [];

  // Add sales price first if found
  if (salesPrice) {
    options.push({
      id: salesPrice.priceType.id,
      name: salesPrice.priceType.name,
      value: salesPrice.value / 100
    });
  }

  // Add other prices
  otherPrices.forEach(price => {
    options.push({
      id: price.priceType.id,
      name: price.priceType.name,
      value: price.value / 100
    });
  });

  return options;
};

/**
 * Creates a product selection handler that automatically sets sales price
 * @param setSelectedProduct - Function to set the selected product
 * @param setPriceType - Function to set the price type
 * @returns A handler function for product selection
 */
export const createProductSelectHandler = (
  setSelectedProduct: (product: Product) => void,
  setPriceType: (priceType: string) => void
) => {
  return (product: Product) => {
    setSelectedProduct(product);

    // Automatically set the sales price type
    const salesPriceTypeId = getSalesPriceTypeId(product);
    if (salesPriceTypeId) {
      setPriceType(salesPriceTypeId);
    }
  };
};
