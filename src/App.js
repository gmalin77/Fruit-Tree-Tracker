import React, { useEffect, useState } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCGc5UelJLqXQ5JUTakbDYR73wY8VmL12I",
  authDomain: "fruit-tree-tracker-23803.firebaseapp.com",
  projectId: "fruit-tree-tracker-23803",
  storageBucket: "fruit-tree-tracker-23803.firebasestorage.app",
  messagingSenderId: "515156659805",
  appId: "1:515156659805:web:75025906e1e7d344e1c7b4",
  measurementId: "G-M8QJ1XMHHB",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const libraries = ["places"];
const mapContainerStyle = {
  height: "100vh",
  width: "100%",
};
const center = {
  lat: 42.3736,
  lng: -71.1097,
};

function App() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: "AIzaSyCwCc3vg0r5_Q1RAtqAYa-on13NSTQMVi8",
    libraries,
  });

  const [markers, setMarkers] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [fruit, setFruit] = useState("");
  const [season, setSeason] = useState("");
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "trees"));
        const treeData = snapshot.docs.map((doc) => doc.data());
        setMarkers(treeData);
      } catch (error) {
        console.error("Error fetching markers:", error);
      }
    };
    fetchMarkers();
  }, []);

  const handleMapClick = (e) => {
    if (e && e.latLng) {
      setSelectedPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let photoUrl = "";
      if (photo) {
        const photoRef = ref(
          storage,
          `tree_photos/${photo.name}_${Date.now()}`
        );
        await uploadBytes(photoRef, photo);
        photoUrl = await getDownloadURL(photoRef);
      }

      const newTree = {
        type: fruit,
        season,
        location: selectedPosition,
        photoUrl,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "trees"), newTree);
      setMarkers((prev) => [...prev, newTree]);
      setFruit("");
      setSeason("");
      setPhoto(null);
      setSelectedPosition(null);
    } catch (error) {
      console.error("Error saving tree:", error);
    }
  };

  if (loadError) return "Error loading maps";
  if (!isLoaded) return "Loading Maps";

  return (
    <div className="flex">
      <div className="w-1/3 p-4 bg-white h-screen overflow-auto">
        <h2 className="text-xl font-bold mb-4">Add Fruit Tree</h2>
        {selectedPosition ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={fruit}
              onChange={(e) => setFruit(e.target.value)}
              placeholder="Type of fruit (e.g., apple)"
              className="w-full border p-2"
              required
            />
            <input
              type="text"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="Fruiting season (e.g., July–Sept)"
              className="w-full border p-2"
              required
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              className="w-full"
            />
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Save Tree
            </button>
          </form>
        ) : (
          <p>Click on the map to mark a new tree.</p>
        )}
      </div>
      <div className="w-2/3 h-screen">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={14}
          center={center}
          onClick={handleMapClick}
        >
          {markers.map((marker, index) => (
            <Marker
              key={index}
              position={marker.location}
              label={marker.type?.[0] || ""}
            />
          ))}
        </GoogleMap>
      </div>
    </div>
  );
}

export default App;
