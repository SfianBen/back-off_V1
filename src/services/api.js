import { API_URL } from '../config'; 

// ============ AUTHENTIFICATION ============
export async function login(username, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  
  if (!res.ok) {
    throw new Error("Erreur de connexion");
  }
  
  const data = await res.json();
  return data; // Retourne { access_token, token_type }
}

// ============ PARKINGS (DOCKS GROUPS) ============
export async function fetchParkings(lat, lon, radius = 5000) {
  const url = new URL(`${API_URL}/api/public/docks-groups`);
  if (lat && lon) {
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lon);
    url.searchParams.set("radius_meters", radius);
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Erreur lors du chargement des parkings");
  }
  return res.json();
}

export async function createParkingGroup(parking, token) {
  const res = await fetch(`${API_URL}/api/admin/docks-groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(parking),
  });
  
  if (!res.ok) {
    throw new Error("Erreur lors de la création du parking");
  }
  
  return res.json();
}

// Supprimer un parking (Docks Group)
export async function deleteParkingGroup(groupId, token) {
    const res = await fetch(`${API_URL}/api/admin/docks-groups/${groupId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Erreur lors de la suppression du parking");
    return true;
  }
  
  // Supprimer un socle (Dock)
  export async function deleteDock(dockId, token) {
    const res = await fetch(`${API_URL}/api/admin/docks/${dockId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Erreur lors de la suppression du socle");
    return true;
  }

// ============ BORNES/SOCLE (DOCKS) ============
export async function createDock(dock, token) {
  const res = await fetch(`${API_URL}/api/admin/docks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dock),
  });
  
  if (!res.ok) {
    throw new Error("Erreur lors de la création de la borne");
  }
  
  return res.json();
}

export async function updateDock(dockId, dock, token) {
  const res = await fetch(`${API_URL}/api/admin/docks/${dockId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dock),
  });
  
  if (!res.ok) {
    throw new Error("Erreur lors de la mise à jour de la borne");
  }
  
  return res.json();
}

export async function getDocks(token) {
  const res = await fetch(`${API_URL}/api/admin/docks`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    throw new Error("Erreur lors du chargement des bornes");
  }
  
  return res.json();
}

// ============ IMAGES ============
export async function uploadParkingImage(groupId, imageFile, token) {
  const formData = new FormData();
  formData.append('file', imageFile);

  const res = await fetch(`${API_URL}/api/admin/docks-groups/${groupId}/image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!res.ok) {
    throw new Error("Erreur lors de l'upload de l'image");
  }
  
  return res.json();
}

export async function uploadParkingImageBase64(groupId, base64Image, token) {
  // Convertir base64 en Blob
  const base64Data = base64Image.split(',')[1];
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/jpeg' });
  
  const formData = new FormData();
  formData.append('file', blob, 'parking.jpg');

  const res = await fetch(`${API_URL}/api/admin/docks-groups/${groupId}/image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!res.ok) {
    throw new Error("Erreur lors de l'upload de l'image");
  }
  
  return true; // L'API retourne 204 (No Content)
}

export async function deleteParkingImage(groupId, token) {
  const res = await fetch(`${API_URL}/api/admin/docks-groups/${groupId}/image`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    throw new Error("Erreur lors de la suppression de l'image");
  }
  
  return res.json();
}

// ============ SENSOR UPDATE ============
export async function updateSensor(sensorId, status) {
  const res = await fetch(`${API_URL}/api/sensor/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sensor_id: sensorId,
      status: status,
    }),
  });
  
  if (!res.ok) {
    throw new Error("Erreur lors de la mise à jour du capteur");
  }
  
  return res.json();
}

// ============ REPORT DEFECT ============
export async function reportDefect(dockId, description) {
  const res = await fetch(`${API_URL}/api/report-defect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dock_id: dockId,
      description: description,
    }),
  });
  
  if (!res.ok) {
    throw new Error("Erreur lors du signalement du défaut");
  }
  
  return res.json();
}