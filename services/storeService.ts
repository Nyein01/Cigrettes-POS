import { db } from './firebaseConfig';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  writeBatch,
  query,
  orderBy,
  getDocs,
  increment,
  getDoc
} from 'firebase/firestore';
import { Product, Sale } from '../types';

const PRODUCTS_COLLECTION = 'products';
const SALES_COLLECTION = 'sales';
const ARCHIVE_COLLECTION = 'archived_sales';

// --- Products (Real-time) ---

// Subscribe to product updates (Real-time)
export const subscribeToProducts = (callback: (products: Product[]) => void) => {
  const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('name'));
  
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
    callback(products);
  });
};

// Add a new product (Async)
export const addProduct = async (product: Omit<Product, 'id'>): Promise<void> => {
  try {
    await addDoc(collection(db, PRODUCTS_COLLECTION), product);
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};

// Update existing product (Async)
export const updateProduct = async (product: Product): Promise<void> => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, product.id);
    const { id, ...data } = product; // Remove ID from data payload
    await updateDoc(productRef, data);
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

// Delete product (Async)
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

// --- Sales (Real-time & Transactional) ---

// Subscribe to sales history (Real-time)
export const subscribeToSales = (callback: (sales: Sale[]) => void) => {
  const q = query(collection(db, SALES_COLLECTION), orderBy('date', 'asc')); // 'asc' for charts
  
  return onSnapshot(q, (snapshot) => {
    const sales = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Sale[];
    callback(sales);
  });
};

// Save sale and update inventory atomically (Async)
export const saveSale = async (sale: Sale): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // 1. Create the Sale Record
    const saleRef = doc(collection(db, SALES_COLLECTION));
    const saleData = { ...sale, id: saleRef.id };
    batch.set(saleRef, saleData);

    // 2. Decrement Stock for each item
    sale.items.forEach(item => {
        const productRef = doc(db, PRODUCTS_COLLECTION, item.id);
        const newStock = Math.max(0, item.stock - item.quantity); // Calculate new stock locally, ideally use increment(-qty) but this works for basic needs
        batch.update(productRef, { stock: newStock });
    });

    await batch.commit();
  } catch (error) {
    console.error("Error processing sale:", error);
    throw error;
  }
};

// Delete Sale (Void) and Restock Items
export const deleteSale = async (saleId: string): Promise<void> => {
  try {
    const saleRef = doc(db, SALES_COLLECTION, saleId);
    const saleSnap = await getDoc(saleRef);

    if (!saleSnap.exists()) {
        throw new Error("Sale not found");
    }

    const sale = saleSnap.data() as Sale;
    const batch = writeBatch(db);

    // 1. Restock items
    sale.items.forEach(item => {
        const productRef = doc(db, PRODUCTS_COLLECTION, item.id);
        batch.update(productRef, { stock: increment(item.quantity) });
    });

    // 2. Delete the sale record
    batch.delete(saleRef);

    await batch.commit();
  } catch (error) {
    console.error("Error deleting sale:", error);
    throw error;
  }
};

// Clear all sales history (Async)
export const clearSalesHistory = async (): Promise<void> => {
  try {
    const q = query(collection(db, SALES_COLLECTION));
    const snapshot = await getDocs(q);
    
    // Firestore batch limit is 500 operations
    const BATCH_SIZE = 500;
    let batch = writeBatch(db);
    let count = 0;

    for (const doc of snapshot.docs) {
        batch.delete(doc.ref);
        count++;
        if (count >= BATCH_SIZE) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
        }
    }
    
    if (count > 0) {
        await batch.commit();
    }
  } catch (error) {
    console.error("Error clearing sales history:", error);
    throw error;
  }
};

// --- Archive System ---

// Archive Current Sales: Move from 'sales' to 'archived_sales'
export const archiveCurrentSales = async (): Promise<void> => {
  try {
    const q = query(collection(db, SALES_COLLECTION));
    const snapshot = await getDocs(q);
    
    const BATCH_SIZE = 250; 
    let batch = writeBatch(db);
    let count = 0;

    for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        const newRef = doc(collection(db, ARCHIVE_COLLECTION), docSnapshot.id); 
        
        batch.set(newRef, data);
        batch.delete(docSnapshot.ref);

        count++;
        if (count >= BATCH_SIZE) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
        }
    }
    
    if (count > 0) {
        await batch.commit();
    }
  } catch (error) {
    console.error("Error archiving sales:", error);
    throw error;
  }
};

// Subscribe to Archived Sales
export const subscribeToArchivedSales = (callback: (sales: Sale[]) => void) => {
  const q = query(collection(db, ARCHIVE_COLLECTION), orderBy('date', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const sales = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Sale[];
    callback(sales);
  });
};

// Restore Archived Sales: Move from 'archived_sales' to 'sales'
export const restoreArchivedSales = async (): Promise<void> => {
  try {
    const q = query(collection(db, ARCHIVE_COLLECTION));
    const snapshot = await getDocs(q);
    
    const BATCH_SIZE = 250;
    let batch = writeBatch(db);
    let count = 0;

    for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data();
        const newRef = doc(collection(db, SALES_COLLECTION), docSnapshot.id);
        
        batch.set(newRef, data);
        batch.delete(docSnapshot.ref);

        count++;
        if (count >= BATCH_SIZE) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
        }
    }
    
    if (count > 0) {
        await batch.commit();
    }
  } catch (error) {
    console.error("Error restoring sales:", error);
    throw error;
  }
};

export const getProductsOnce = (): Promise<Product[]> => {
    return new Promise((resolve) => {
        const unsubscribe = subscribeToProducts((data) => {
            unsubscribe();
            resolve(data);
        });
    });
};