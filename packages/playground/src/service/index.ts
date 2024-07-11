export function saveSceneJson(jsonObj: any) {
  localStorage.setItem('scene-json', JSON.stringify(jsonObj));
}

export function getSceneJson() {
  const json = localStorage.getItem('scene-json');
  return json ? JSON.parse(json) : null;
}
