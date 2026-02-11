import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, auth } from '@/services/firebase';
import { GarmentType } from '@/constants/garments';

const getWardrobeRef = (uid: string) =>
  collection(db, 'users', uid, 'wardrobe');
const getItemRef = (uid: string, itemId: string) =>
  doc(db, 'users', uid, 'wardrobe', itemId);

export const fetchWardrobeItems = async () => {
  const user = auth.currentUser;
  if (!user) return [];

  const snapshot = await getDocs(getWardrobeRef(user.uid));

  return snapshot.docs.map((doc) => ({
    id: doc.id as GarmentType,
    colors: doc.data().colors || [],
  }));
};

export const addColorToGarment = async (itemId: string, color: string) => {
  const user = auth.currentUser;
  if (!user) return;

  const itemRef = getItemRef(user.uid, itemId);

  await setDoc(
    itemRef,
    {
      colors: arrayUnion(color),
    },
    { merge: true }
  );
};

export const removeColorFromGarment = async (
  itemId: string,
  colorToRemove: string,
  isLastColor: boolean
) => {
  const user = auth.currentUser;
  if (!user) return;

  const itemRef = getItemRef(user.uid, itemId);

  if (isLastColor) {
    await deleteDoc(itemRef);
  } else {
    await updateDoc(itemRef, {
      colors: arrayRemove(colorToRemove),
    });
  }
};

export const updateGarmentColorArray = async (
  itemId: string,
  newColors: string[]
) => {
  const user = auth.currentUser;
  if (!user) return;

  const itemRef = getItemRef(user.uid, itemId);
  await updateDoc(itemRef, {
    colors: newColors,
  });
};

export const deleteGarment = async (itemId: string) => {
  const user = auth.currentUser;
  if (!user) return;

  const itemRef = getItemRef(user.uid, itemId);
  await deleteDoc(itemRef);
};
