import '../global.css';
import { Redirect } from "expo-router";
import { useAuth } from '@/hooks/useAuth';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
    const { user, loading } = useAuth();
    
    if (loading) {
      return (
        <View className="flex-1 justify-center items-center bg-gray-50">
          <ActivityIndicator size="large" color="blue" />
        </View>
      );
    }

    if (user) {
      return <Redirect href="/home" />;
    } else {
      return <Redirect href="/login" />;
    }
}