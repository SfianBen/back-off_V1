import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Plus, Trash2, Image, X } from 'lucide-react';
import { 
  createParkingGroup, 
  createDock, 
  deleteParkingGroup,         
} from '../services/api';

import { API_URL } from '../config'; 

// Icône parking
const createParkingIcon = (occupees, total, color) => new L.DivIcon({
  className: 'parking-marker',
  html: `
    <div style="position: relative; width: 40px; height: 55px;">
      <div style="
        width: 40px; height: 40px; border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg); background: ${color};
        position: absolute; top: 0; left: 0;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
      ">
        <span style="transform: rotate(45deg); color: white; font-weight: bold; font-size: 11px;">
          ${occupees}/${total}
        </span>
      </div>
    </div>
  `,
  iconSize: [40, 55],
  iconAnchor: [20, 55],
  popupAnchor: [0, -50],
});

const tempIcon = new L.DivIcon({
  className: 'temp-icon',
  html: '<div style="background:#ff0000;color:white;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.3)">+</div>',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function ClickHandler({ onMapClick }) {
  useMapEvents({ click(e) { onMapClick(e.latlng); } });
  return null;
}

function AddMarkerPopup({ onAddClick }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px' }}>
      <button onClick={onAddClick} style={{ padding: '10px 20px', background: 'black', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Plus size={18} />Ajouter
      </button>
    </div>
  );
}

function AddParkingModal({ position, onClose, onAdd }) {
  const [nom, setNom] = useState('');
  const [coordX, setCoordX] = useState(position ? position.lat.toFixed(6) : '50.357000');
  const [coordY, setCoordY] = useState(position ? position.lng.toFixed(6) : '3.523000');
  const [ville, setVille] = useState('Chargement...');
  const [socles, setSocles] = useState([]);
  const [newSocleId, setNewSocleId] = useState('');
  const [newCapteurId, setNewCapteurId] = useState('');
  const [newSocleStatut, setNewSocleStatut] = useState('available');
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    const fetchVille = async () => {
      if (!coordX || !coordY || isNaN(parseFloat(coordX)) || isNaN(parseFloat(coordY))) {
        setVille('');
        return;
      }
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordX}&lon=${coordY}&zoom=18&addressdetails=1`);
        const data = await response.json();
        setVille(data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || 'Non spécifiée');
      } catch (error) {
        console.error('Erreur récupération ville:', error);
        setVille('Non spécifiée');
      }
    };
    const timeoutId = setTimeout(fetchVille, 500);
    return () => clearTimeout(timeoutId);
  }, [coordX, coordY]);

  const handleAddSocle = () => {
    if (!newSocleId.trim()) {
      alert('Veuillez entrer un ID Socle');
      return;
    }
    if (!newCapteurId.trim()) {
      alert('Veuillez entrer un ID Capteur');
      return;
    }
    if (socles.some(s => s.socleId === newSocleId)) {
      alert('Cet ID Socle existe déjà');
      return;
    }
    setSocles([...socles, { socleId: newSocleId, capteurId: newCapteurId, statut: newSocleStatut }]);
    setNewSocleId('');
    setNewCapteurId('');
    setNewSocleStatut('available');
  };
 //Supprimer socle
  const handleDeleteSocle = (socleId) => {
    setSocles(socles.filter(s => s.socleId !== socleId));
  };

  const handleUpdateSocle = (socleId, field, value) => {
    setSocles(socles.map(s => s.socleId === socleId ? { ...s, [field]: value } : s));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleValidate = () => {
    if (!nom.trim()) {
      alert('Veuillez entrer un nom de zone');
      return;
    }
    if (!coordX || !coordY || isNaN(parseFloat(coordX)) || isNaN(parseFloat(coordY))) {
      alert('Veuillez entrer des coordonnées valides');
      return;
    }
    onAdd({ nom, latitude: parseFloat(coordX), longitude: parseFloat(coordY), ville, socles, photo });
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}><Plus size={20} style={{ marginRight: '8px' }} />Ajouter une zone de Parking</h3>
          <button onClick={onClose} style={styles.closeButton}><X size={20} /></button>
        </div>
        <div style={styles.modalBody}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nom de la zone</label>
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} style={styles.input} placeholder="Ex: Gare de Valenciennes" />
          </div>
          <div style={styles.coordRow}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Coordonnées X :</label>
              <input type="text" value={coordX} onChange={(e) => setCoordX(e.target.value)} style={styles.input} placeholder="Ex: 50.357" />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Y :</label>
              <input type="text" value={coordY} onChange={(e) => setCoordY(e.target.value)} style={styles.input} placeholder="Ex: 3.523" />
            </div>
          </div>
          {ville && (
            <div style={styles.villeInfo}>
              <label style={styles.label}>Ville détectée :</label>
              <div style={styles.villeValue}>{ville}</div>
            </div>
          )}
          <div style={styles.addSocleSection}>
            <label style={styles.label}>Ajouter un socle</label>
            <div style={styles.addSocleRow}>
              <input type="text" value={newSocleId} onChange={(e) => setNewSocleId(e.target.value)} style={{ ...styles.input, flex: 1 }} placeholder="ID_Socle" />
              <input type="text" value={newCapteurId} onChange={(e) => setNewCapteurId(e.target.value)} style={{ ...styles.input, flex: 1 }} placeholder="ID_Capteur" />
              <select value={newSocleStatut} onChange={(e) => setNewSocleStatut(e.target.value)} style={{ ...styles.select, width: '120px' }}>
                <option value="available">Libre</option>
                <option value="occupied">Occupé</option>
                <option value="defect">Anomalie</option>
              </select>
              <button onClick={handleAddSocle} style={styles.addSocleButton}><Plus size={18} /></button>
            </div>
          </div>
          <div style={styles.soclesList}>
            <label style={styles.label}>Liste de socles :</label>
            {socles.length === 0 && <p style={styles.emptyText}>Aucun socle ajouté</p>}
            {socles.map((socle) => (
              <div key={socle.socleId} style={styles.socleItem}>
                <input type="text" value={socle.socleId} onChange={(e) => handleUpdateSocle(socle.socleId, 'socleId', e.target.value)} style={{ ...styles.socleIdInput, width: '100px' }} placeholder="ID_Socle" />
                <input type="text" value={socle.capteurId} onChange={(e) => handleUpdateSocle(socle.socleId, 'capteurId', e.target.value)} style={{ ...styles.socleIdInput, width: '100px' }} placeholder="ID_Capteur" />
                <select value={socle.statut} onChange={(e) => handleUpdateSocle(socle.socleId, 'statut', e.target.value)} style={styles.socleSelect}>
                  <option value="available">Libre</option>
                  <option value="occupied">Occupé</option>
                  <option value="defect">Anomalie</option>
                </select>
                <button onClick={() => handleDeleteSocle(socle.socleId)} style={styles.deleteSocleButton}>🗑️</button>
              </div>
            ))}
          </div>
          <div style={styles.photoSection}>
            <label htmlFor="photo-upload" style={styles.photoLabel}><Image size={18} style={{ marginRight: '8px' }} />Ajouter une photo du Parking</label>
            <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
            {photo && (
              <div style={styles.photoPreview}>
                <img src={photo} alt="Preview" style={styles.photoImg} />
                <button onClick={() => setPhoto(null)} style={styles.removePhotoButton}><X size={16} /></button>
              </div>
            )}
          </div>
          <button onClick={handleValidate} style={styles.validateButton}>Valider</button>
        </div>
      </div>
    </div>
  );
}

function ParkingPopup({ parking, onDelete, onReload, token }) {
  const [showPhoto, setShowPhoto] = useState(false);
  const [addingSocle, setAddingSocle] = useState(false);
  const [newSocleId, setNewSocleId] = useState('');
  const [newCapteurId, setNewCapteurId] = useState('');

  const updateBorneStatus = async (borne, newStatus) => {
    try {
      console.log('Mise à jour borne:', borne, 'vers statut:', newStatus);
      
      // Mapper le statut vers le format de l'API
      let apiStatus = 'out_of_service';
      if (newStatus === 'libre') apiStatus = 'available';
      else if (newStatus === 'occupée') apiStatus = 'occupied';
      
      console.log('Appel API PUT /api/admin/docks/', borne.db_id);
      
      // Utiliser PUT /api/admin/docks/{dock_id}
      const res = await fetch(`${API_URL}/api/admin/docks/${borne.db_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: apiStatus,
        }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Erreur API:', errorText);
        throw new Error("Erreur mise à jour");
      }
      
      console.log(' Photo uploadée avec succès');
      
      // Attendre un peu avant de recharger
      await new Promise(resolve => setTimeout(resolve, 300));
      await onReload();
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      alert('Erreur lors de la mise à jour du statut: ' + error.message);
    }
  };

  const deleteBorne = async (borne) => {
    if (!window.confirm(`Supprimer la borne ${borne.id} définitivement ?`)) return;
    
    try {
      const res = await fetch(`${API_URL}/api/admin/docks/${borne.db_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!res.ok) throw new Error("Erreur suppression");
      
      alert('Borne supprimée avec succès');
      await onReload();
    } catch (error) {
      console.error('Erreur suppression borne:', error);
      alert('Erreur lors de la suppression de la borne');
    }
  };

  const handleAddSocle = async () => {
    if (!newSocleId.trim()) {
      alert('Veuillez entrer un ID Socle');
      return;
    }
    if (!newCapteurId.trim()) {
      alert('Veuillez entrer un ID Capteur');
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/api/admin/docks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          group_id: parking.id,
          sensor_id: newCapteurId,
          name: newSocleId,
        }),
      });
      
      if (!res.ok) throw new Error("Erreur ajout");
      
      setNewSocleId('');
      setNewCapteurId('');
      setAddingSocle(false);
      alert('Socle ajouté avec succès');
      await onReload();
    } catch (error) {
      console.error('Erreur ajout socle:', error);
      alert('Erreur lors de l\'ajout du socle');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    e.target.value = '';
  
    try {
      // Supprimer l'ancienne photo si elle existe
      if (parking.photo) {
        await fetch(
          `${API_URL}/api/admin/docks-groups/${parking.id}/image`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
  
      // Upload nouvelle photo
      const formData = new FormData();
      formData.append('file', file);
  
      const res = await fetch(
        `${API_URL}/api/admin/docks-groups/${parking.id}/image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );
  
      if (!res.ok) {
        throw new Error(await res.text());
      }
  
      alert('Photo mise à jour avec succès');
  
      await new Promise(resolve => setTimeout(resolve, 500));
      await onReload();
  
    } catch (error) {
      console.error('Erreur upload photo:', error);
      alert('Erreur lors de l\'upload de la photo');
    }
  };
  

  return (
    <div style={{ minWidth: '280px', fontFamily: 'Arial, sans-serif' }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#333' }}>{parking.nom}</h3>
      <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#666' }}>
        <strong>Ville:</strong> {parking.ville}
      </p>
      <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#666' }}>
        <strong>Bornes:</strong> {parking.bornes.length}
      </p>

      {/* Bouton Ajouter/Changer Photo */}
      <label htmlFor={`photo-upload-${parking.id}`} style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 12px',
        background: '#5c6bc0',
        color: 'white',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 'bold',
        marginBottom: '10px'
      }}>
        <Image size={14} style={{ marginRight: '5px' }} />
        {parking.photo ? 'Changer la photo' : 'Ajouter une photo'}
      </label>
      <input
        id={`photo-upload-${parking.id}`}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        style={{ display: 'none' }}
      />

      {/* Afficher/Masquer Photo */}
      {parking.photo ? (
        <div style={{ marginTop: '5px' }}>
          <button
            onClick={() => setShowPhoto(!showPhoto)}
            style={{
              width: '100%',
              padding: '8px',
              background: '#7986cb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold'
            }}
          >
            {showPhoto ? 'Masquer la photo' : 'Voir la photo'}
          </button>
          {showPhoto && (
            <img 
              src={parking.photo} 
              alt="Parking" 
              style={{ width: '100%', marginTop: '10px', borderRadius: '8px' }} 
            />
          )}
        </div>
      ) : (
        <p style={{ fontSize: '12px', color: '#999', fontStyle: 'italic', marginTop: '0' }}>
          Pas de photo disponible
        </p>
      )}

      <button
        onClick={() => onDelete(parking.id)}
        style={{
          width: '100%',
          padding: '8px',
          marginTop: '10px',
          background: '#ff5252',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '13px'
        }}
      >
        <Trash2 size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
        Supprimer le parking
      </button>

      <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px solid #eee' }} />

      <div style={{ marginBottom: '10px' }}>
        <strong style={{ fontSize: '14px', color: '#333' }}>Liste des bornes :</strong>
      </div>

      {parking.bornes.length === 0 && (
        <p style={{ fontStyle: 'italic', color: '#999', fontSize: '13px', textAlign: 'center' }}>
          Aucune borne pour le moment
        </p>
      )}

      {parking.bornes.map(borne => (
        <div
          key={borne.db_id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
            padding: '8px',
            background: '#f9f9f9',
            borderRadius: '6px',
          }}
        >
          <span style={{ 
            fontWeight: 'bold', 
            fontSize: '13px', 
            minWidth: '80px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {borne.id}
          </span>
          
          <select
            value={borne.statut}
            onChange={(e) => updateBorneStatus(borne, e.target.value)}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '12px',
              flex: 1,
              cursor: 'pointer',
              background: 'white'
            }}
          >
            <option value="libre">Libre</option>
            <option value="occupée">Occupée</option>
            <option value="anomalie">Anomalie</option>
          </select>
          
          <button
            onClick={() => deleteBorne(borne)}
            style={{
              background: '#ff5252',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
            title="Supprimer la borne"
          >
            🗑️
          </button>
        </div>
      ))}

      {/* Formulaire d'ajout de socle */}
      {addingSocle ? (
        <div style={{ 
          marginTop: '10px', 
          padding: '12px', 
          background: '#e3f2fd', 
          borderRadius: '8px',
          border: '1px solid #90caf9'
        }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#1565c0', marginBottom: '5px', display: 'block' }}>
            Nom du socle :
          </label>
          <input
            type="text"
            value={newSocleId}
            onChange={(e) => setNewSocleId(e.target.value)}
            placeholder="Ex: Socle_A1"
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '8px',
              borderRadius: '6px',
              border: '1px solid #90caf9',
              fontSize: '13px',
              boxSizing: 'border-box'
            }}
          />
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#1565c0', marginBottom: '5px', display: 'block' }}>
            ID Capteur :
          </label>
          <input
            type="text"
            value={newCapteurId}
            onChange={(e) => setNewCapteurId(e.target.value)}
            placeholder="Ex: ESP32_001"
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '10px',
              borderRadius: '6px',
              border: '1px solid #90caf9',
              fontSize: '13px',
              boxSizing: 'border-box'
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleAddSocle}
              style={{
                flex: 1,
                padding: '8px',
                background: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px'
              }}
            >
              ✓ Valider
            </button>
            <button
              onClick={() => {
                setAddingSocle(false);
                setNewSocleId('');
                setNewCapteurId('');
              }}
              style={{
                flex: 1,
                padding: '8px',
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px'
              }}
            >
              ✗ Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingSocle(true)}
          style={{
            width: '100%',
            marginTop: '10px',
            padding: '10px',
            borderRadius: '8px',
            border: '2px dashed #2ecc71',
            background: '#e8f5e9',
            color: '#2ecc71',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '5px'
          }}
        >
          <Plus size={16} />
          Ajouter une borne
        </button>
      )}
    </div>
  );
}

function Map() {
  const [parkings, setParkings] = useState([]);
  const [clickedPosition, setClickedPosition] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalPosition, setModalPosition] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('userToken');

  useEffect(() => {
    loadParkings();
  }, []);

  const loadParkings = async () => {
    console.log('Rechargement des parkings...');
    
    if (!token) {
      console.error('Pas de token disponible');
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/api/admin/docks?lat=50.357&lon=3.523&radius_meters=50000000`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!res.ok) throw new Error("Erreur lors du chargement des parkings");
      
      const data = await res.json();
      console.log('Données brutes API:', data);
      console.log('Nombre de parkings:', data.length);
      
      const mapped = data.map(p => {
        const parking = {
          id: p.id,
          nom: p.name,
          ville: p.description || 'Non spécifiée',
          latitude: p.latitude,
          longitude: p.longitude,
          bornes: (p.docks || []).map(d => {
            let statut = "anomalie";
            if (d.status === "available") statut = "libre";
            else if (d.status === "occupied") statut = "occupée";
            else if (d.status === "out_of_service") statut = "anomalie";
            
            return {
              db_id: d.id,
              id: d.name || 'unknown',
              sensor_id: d.sensor_id,
              statut: statut,
            };
          }),
          photo: p.image_url,
        };
        console.log(`Parking mappé: ${parking.nom} (${parking.bornes.length} bornes)`);
        return parking;
      });
      
      console.log('Total parkings chargés:', mapped.length);
      setParkings(mapped);
    } catch (error) {
      console.error('Erreur chargement parkings:', error);
    }
  };

  const handleMapClick = (position) => {
    setClickedPosition(position);
  };

  const handleOpenModalFromButton = () => {
    // Utiliser le centre de la carte comme position par défaut
    setModalPosition({ lat: 50.357, lng: 3.523 });
    setShowModal(true);
  };

  const handleOpenModalFromMap = () => {
    setModalPosition(clickedPosition);
    setShowModal(true);
    setClickedPosition(null);
  };

  const handleAddParking = async (parkingData) => {
    if (!token) {
      alert('Vous devez être connecté');
      return;
    }
  
    setLoading(true);
    try {
      console.log('Création parking:', parkingData);
      
      // 1. Créer le parking group
      const group = await createParkingGroup({
        name: parkingData.nom,
        description: parkingData.ville,
        latitude: parkingData.latitude,
        longitude: parkingData.longitude,
      }, token);
  
      console.log('Groupe créé:', group);
  
      // 2. Uploader la photo si présente
      if (parkingData.photo) {
        try {
          console.log('Upload photo...');
          const base64Data = parkingData.photo.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/jpeg' });
          
          const formData = new FormData();
          formData.append('file', blob, 'parking.jpg');
  
          const photoRes = await fetch(
            `${API_URL}/api/admin/docks-groups/${group.id}/image`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            }
          );
          
          
          if (photoRes.ok) {
            console.log('Photo uploadée');
          }
          if (!photoRes.ok) {
            throw new Error(await photoRes.text());
          }
          
        } catch (error) {
          console.error('Erreur upload photo:', error);
        }
      }
  
      // 3. Créer les bornes
      console.log('🔧 Création des', parkingData.socles.length, 'socles...');
      for (const socle of parkingData.socles) {
        try {
          await createDock({
            group_id: group.id,
            sensor_id: socle.capteurId,
            name: socle.socleId,
          }, token);
          console.log('Socle créé:', socle.socleId);
        } catch (error) {
          console.error('Erreur création borne', socle.socleId, ':', error);
        }
      }
  
      // 4. Fermer le modal immédiatement
      setShowModal(false);
      setClickedPosition(null);
      setModalPosition(null);
      
      // 5. Recharger les parkings après un délai
      console.log('Attente avant rechargement...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Rechargement des parkings...');
      await loadParkings();
      
      alert('Parking ajouté avec succès !');
    } catch (error) {
      console.error('Erreur ajout parking:', error);
      alert('Erreur lors de l\'ajout du parking: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteParking = async (id) => {
    if (window.confirm("Supprimer ce parking et tous ses socles définitivement ?")) {
      try {
        // Appel à la fonction API exportée
        await deleteParkingGroup(id, token); 
        setParkings(prev => prev.filter(p => p.id !== id));
        alert("Parking supprimé avec succès");
      } catch (error) {
        alert("Erreur lors de la suppression du parking : " + error.message);
      }
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.header}>
        <MapPin size={32} style={{ marginRight: '15px' }} />
        <div style={{ flex: 1 }}>
          <h1 style={styles.title}>Carte des bornes</h1>
          <p style={styles.subtitle}>Vue d'ensemble de l'activité WHEELOCK</p>
        </div>
        <button onClick={handleOpenModalFromButton} style={styles.addButton} disabled={loading}>
          <Plus size={20} style={{ marginRight: '8px' }} />{loading ? 'Ajout...' : 'Ajouter'}
        </button>
      </div>
      <div style={styles.mapCard}>
        <MapContainer center={[50.357, 3.523]} zoom={13} style={{ height: '100%', width: '100%', borderRadius: '20px' }} attributionControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onMapClick={handleMapClick} />
          {clickedPosition && (
            <Marker position={clickedPosition} icon={tempIcon}>
              <Popup><AddMarkerPopup onAddClick={handleOpenModalFromMap} /></Popup>
            </Marker>
          )}
          {parkings.map(parking => {
            const libres = parking.bornes.filter(b => b.statut === 'libre').length;
            const occupees = parking.bornes.filter(b => b.statut === 'occupée').length;
            const total = parking.bornes.length;
            const hasAnomalie = parking.bornes.some(b => b.statut === 'anomalie');
            let color = '#3498db';
            if (hasAnomalie) color = '#e74c3c';
            else if (libres > 0) color = '#2ecc71';
            return (
              <Marker key={parking.id} position={[parking.latitude, parking.longitude]} icon={createParkingIcon(libres, total, color)}>
                <Popup><ParkingPopup parking={parking} onDelete={deleteParking} onReload={loadParkings} token={token} /></Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
      {showModal && <AddParkingModal position={modalPosition} onClose={() => { setShowModal(false); setModalPosition(null); }} onAdd={handleAddParking} />}
    </div>
  );
}

const styles = {
  pageContainer: { padding: '25px', width: '100%', boxSizing: 'border-box', height: '100vh', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', alignItems: 'center', marginBottom: '20px' },
  title: { fontSize: '26px', fontWeight: '800', margin: 0, color: '#1a1a1a', letterSpacing: '-0.5px' },
  subtitle: { margin: '2px 0 0 0', color: '#666', fontSize: '14px' },
  addButton: { display: 'flex', alignItems: 'center', padding: '10px 20px', background: 'black', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  mapCard: { backgroundColor: 'white', borderRadius: '20px', padding: '15px', flex: 1, overflow: 'hidden' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { backgroundColor: 'white', borderRadius: '20px', width: '550px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #eee' },
  modalTitle: { margin: 0, fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center' },
  closeButton: { background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px' },
  modalBody: { padding: '20px', overflowY: 'auto' },
  inputGroup: { marginBottom: '15px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#333' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
  coordRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' },
  addSocleSection: { marginBottom: '15px' },
  addSocleRow: { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' },
  select: { padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' },
  addSocleButton: { background: '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  soclesList: { marginBottom: '15px' },
  emptyText: { fontSize: '13px', color: '#999', fontStyle: 'italic' },
  socleItem: { display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', padding: '8px', background: '#f9f9f9', borderRadius: '8px' },
  socleIdInput: { flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px' },
  socleSelect: { padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', width: '100px' },
  deleteSocleButton: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '0 5px' },
  photoSection: { marginBottom: '15px' },
  photoLabel: { display: 'inline-flex', alignItems: 'center', padding: '10px 15px', background: '#5c6bc0', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' },
  photoPreview: { marginTop: '10px', position: 'relative' },
  photoImg: { width: '100%', borderRadius: '8px' },
  removePhotoButton: { position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  validateButton: { width: '100%', padding: '12px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' },
  villeInfo: { marginBottom: '15px', padding: '12px', background: '#f0f7ff', borderRadius: '8px', border: '1px solid #b3d9ff' },
  villeValue: { fontSize: '15px', fontWeight: 'bold', color: '#1565c0', marginTop: '5px' }
};

export default Map;