export const addGameToArcGIS = async (gameData) => {
  try {
    const featureLayerUrl = process.env.ARCGIS_FEATURE_LAYER_URL;
    const clientId = process.env.ARCGIS_CLIENT_ID;
    const clientSecret = process.env.ARCGIS_CLIENT_SECRET;

    if (!featureLayerUrl || !clientId || !clientSecret) {
      console.log("[ArcGIS] Skipping ArcGIS sync: Missing URL or OAuth keys.");
      return null;
    }

    // The OAuth Handshake to get a temporary token 
    const tokenParams = new URLSearchParams();
    tokenParams.append('client_id', clientId);
    tokenParams.append('client_secret', clientSecret);
    tokenParams.append('grant_type', 'client_credentials');

    const tokenResponse = await fetch('https://www.arcgis.com/sharing/rest/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.error("[ArcGIS] Failed to authenticate with ArcGIS:", tokenData);
      return null;
    }

    const accessToken = tokenData.access_token;

    // Send the game data to the Feature Layer 
    const featureData = [{
      geometry: {
        x: gameData.longitude,
        y: gameData.latitude,
        spatialReference: { wkid: 4326 } // Standard GPS coordinates
      },
      attributes: {
        game_id: gameData.id,
        title: gameData.title,
        game_type: gameData.gameType,
        object_label: gameData.objectLabel
      }
    }];

    const formData = new URLSearchParams();
    formData.append('f', 'json');
    formData.append('features', JSON.stringify(featureData));
    formData.append('token', accessToken); // Attach our new temporary token

    const response = await fetch(`${featureLayerUrl}/addFeatures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });

    const result = await response.json();
    
    if (result.error) {
       console.error("[ArcGIS] ArcGIS API Error:", result.error);
       return null;
    }

    console.log(`[ArcGIS] Successfully synced game to map! Object ID: ${result.addResults[0].objectId}`);
    return result;

  } catch (error) {
    console.error("[ArcGIS] Error syncing to ArcGIS:", error);
  }
};