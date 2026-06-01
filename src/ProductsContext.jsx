import { createContext, useContext, useEffect, useState } from "react";
import { subscribeProducts } from "./services/firestore";
import { seedProductsIfEmpty } from "./services/firestore";
import { allProducts as localProducts } from "./data/products";

const ProductsContext = createContext([]);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(localProducts); // start with local data instantly
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    // Seed Firestore from local data if empty (first run only)
    seedProductsIfEmpty(localProducts).then(() => setSeeded(true));
  }, []);

  useEffect(() => {
    if (!seeded) return;
    // Subscribe to live Firestore products
    const unsub = subscribeProducts(firestoreProducts => {
      if (firestoreProducts.length > 0) {
        setProducts(firestoreProducts);
      }
    });
    return () => unsub();
  }, [seeded]);

  return (
    <ProductsContext.Provider value={products}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductsContext);
}
