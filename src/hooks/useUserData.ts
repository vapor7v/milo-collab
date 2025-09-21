import { useQuery } from '@tanstack/react-query';
import { auth, db } from '@/integrations/firebase/client';
import { doc, getDoc } from 'firebase/firestore';

const fetchUserData = async () => {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  const userDocRef = doc(db, 'users', user.uid);
  const userDocSnap = await getDoc(userDocRef);

  return userDocSnap.exists() ? userDocSnap.data() : null;
};

export const useUserData = () => {
  return useQuery({
    queryKey: ['userData', auth.currentUser?.uid],
    queryFn: fetchUserData,
    enabled: !!auth.currentUser,
  });
};
