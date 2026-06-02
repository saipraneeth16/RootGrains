import { createContext, useContext, useEffect, useState } from "react";
import { subscribeProducts } from "./services/firestore";

const ProductsContext = createContext([]);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeProducts(firestoreProducts => {
      setProducts(firestoreProducts.filter(p => p.active !== false));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <ProductsContext.Provider value={{ products, loading }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductsContext);
}
