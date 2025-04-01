import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, PermissionsAndroid, Platform } from "react-native";
import { RNCamera } from "react-native-camera";
import { checkIfExists, markAsScanned } from "../db";

export default function ScannerScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "This app needs access to your camera to scan QR codes.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        setHasPermission(true);
      }
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    checkIfExists(data, (record) => {
      if (record) {
        if (record.scanned) {
          alert("Already Scanned!");
        } else {
          markAsScanned(data);
          alert("Valid QR Code! Marked as scanned.");
        }
      } else {
        alert("Invalid QR Code!");
      }
    });
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <RNCamera
        style={StyleSheet.absoluteFillObject}
        onBarCodeRead={scanned ? undefined : handleBarCodeScanned}
        captureAudio={false}
      />
      {scanned && (
        <Button title="Scan Again" onPress={() => setScanned(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: 300,
  },
});