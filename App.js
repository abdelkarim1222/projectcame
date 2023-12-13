import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Camera } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import { FontAwesome } from '@expo/vector-icons';
import axios from 'axios';

export default function App() {
  const CameraRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState([]);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleFaceDetected = ({ faces }) => {
    if (faces.length > 0) {
      console.log('Faces Detected: ', faces.length);
      setDetectedFaces(faces);
      sendDetectedFacesToServer(faces);
    } else {
      console.log('No Face detected!!!');
    }
  };

  const sendDetectedFacesToServer = async (faces) => {
    const serverUrl = 'http://192.168.1.41:5000'; // Remplacez par l'adresse de votre serveur Flask
    try {
      const response = await axios.post(`${serverUrl}/process_faces`, { faces });
      console.log('Server Response:', response.data);
    } catch (error) {
      console.error('Error sending faces to server:', error.message);
    }
  };

  const toggleFaceDetection = async () => {
    if (isDetecting) {
      if (CameraRef.current) {
        await CameraRef.current.pausePreview();
      }
    } else {
      if (CameraRef.current) {
        await CameraRef.current.resumePreview();
      }
    }
    setIsDetecting((prev) => !prev);
  };

  const getBorderColor = () => {
    return isDetecting ? 'green' : 'red';
  };

  const renderFaceBoxes = () => {
    return detectedFaces.map((face, index) => (
      <View
        key={index}
        style={[
          styles.faceBox,
          {
            left: face.bounds.origin.x,
            top: face.bounds.origin.y,
            width: face.bounds.size.width,
            height: face.bounds.size.height,
            borderColor: getBorderColor(),
          },
        ]}
      />
    ));
  };

  if (hasPermission === null) {
    return <View style={styles.container} />;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>No access to Camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        {isDetecting && (
          <Camera
            style={styles.camera}
            type={Camera.Constants.Type.front}
            onFacesDetected={handleFaceDetected}
            faceDetectorSettings={{
              mode: FaceDetector.FaceDetectorMode.fast,
              detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
              runClassifications: FaceDetector.FaceDetectorClassifications.none,
              minDetectionInterval: 300,
              tracking: true,
            }}
            ref={CameraRef}
          >
            {renderFaceBoxes()}
          </Camera>
        )}
      </View>
      <TouchableOpacity style={styles.button} onPress={toggleFaceDetection}>
        <Text style={styles.buttonText}>
          {isDetecting ? (
            <FontAwesome name="camera" size={40} />
          ) : (
            <FontAwesome name="camera" size={40} />
          )}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C1CECE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceBox: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 5,
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    borderRadius: 10,
  },
  camera: {
    flex: 1,
  },
  button: {
    backgroundColor: '#376B69',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
});
