// import React from 'react'
import React from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore"; 


const fetchFormData = async (month, year) => {
    const db = getFirestore();
    const docRef = doc(db, "forms", `${year}-${month}`); // Assuming a document ID pattern like "2024-12"
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data(); // Return saved form data
    } else {
        return null; // No saved data
    }
};

export default fetchFormData