// app/camera/index.tsx
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { X, Zap, ZapOff, ArrowRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CameraScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [flash, setFlash] = useState(false);
    const cameraRef = useRef<CameraView>(null);
    const router = useRouter();

    if (!permission) return <View />;
    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <Text style={styles.permText}>We need your camera to scan fabrics.</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.permButton}>
                    <Text style={styles.permButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    base64: true, // We might need this for color extraction logic later
                });

                // Navigate to Editor and pass the image URI
                if (photo?.uri) {
                    router.push({
                        pathname: '/camera/editor',
                        params: { imageUri: photo.uri }
                    });
                }
            } catch (error) {
                Alert.alert("Error", "Failed to capture image");
            }
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar hidden />

            <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                enableTorch={flash}
                ref={cameraRef}
            >
                <SafeAreaView style={styles.uiContainer}>

                    {/* Header Controls */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                            <X color="#fff" size={28} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setFlash(!flash)} style={styles.iconBtn}>
                            {flash ? <Zap color="#FFD700" size={28} /> : <ZapOff color="#fff" size={28} />}
                        </TouchableOpacity>
                    </View>

                    {/* Bottom Controls */}
                    <View style={styles.footer}>
                        <View style={styles.spacer} />

                        {/* Shutter Button */}
                        <TouchableOpacity onPress={takePicture} style={styles.shutterOuter}>
                            <View style={styles.shutterInner} />
                        </TouchableOpacity>

                        <View style={styles.spacer} />
                    </View>
                </SafeAreaView>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
    permText: { color: '#fff', marginBottom: 20 },
    permButton: { padding: 10, backgroundColor: '#00dec3', borderRadius: 8 },
    permButtonText: { fontWeight: 'bold' },

    uiContainer: { flex: 1, justifyContent: 'space-between' },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
    iconBtn: { padding: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20 },

    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 40,
        paddingHorizontal: 30
    },
    spacer: { flex: 1 },
    shutterOuter: {
        width: 80, height: 80, borderRadius: 40,
        borderWidth: 4, borderColor: '#fff',
        alignItems: 'center', justifyContent: 'center'
    },
    shutterInner: {
        width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff'
    }
});