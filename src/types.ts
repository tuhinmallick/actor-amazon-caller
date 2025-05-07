export interface productOffer {
    asin: string;
    keyword: string;
    offer: string;
    productDescription: string;
    productUrl: string;
    sellerName: string;
    productTitle: string;
}

type ProductOfferField = keyof productOffer;

export interface Input {
    useClient: boolean;
    memory: number;
    maxItems: number;
    fields: ProductOfferField[];
}
