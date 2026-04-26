export const API_BASE_URL = "http://localhost:8000";

export const emptyGeoJSON = { type: "FeatureCollection", features: [] };

export const getClosestIndex = (targetTimeMs: number, epochsArray: number[]) => {
  let closestIdx = 0;
  let minDiff = Infinity;
  for (let i = 0; i < epochsArray.length; i++) {
    const diff = Math.abs(epochsArray[i] - targetTimeMs);
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = i;
    } else if (diff > minDiff) {
      break; // Array is sorted, break early
    }
  }
  return closestIdx;
};

export const formatTime = (isoString: string) => {
  return new Date(isoString).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
