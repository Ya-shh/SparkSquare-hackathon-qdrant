
export const handleAvatarError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  username: string = 'User'
) => {
  const gender = Math.random() > 0.5 ? 'men' : 'women';
  const imageNumber = Math.floor(Math.random() * 99) + 1;
  const fallbackUrl = `https://randomuser.me/api/portraits/${gender}/${imageNumber}.jpg`;
  
  e.currentTarget.src = fallbackUrl;
  
  e.currentTarget.onerror = null;
}; 