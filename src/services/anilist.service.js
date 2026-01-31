import { config } from '../config.js';

/**
 * AniList GraphQL API Service
 * Lấy thông tin nhân vật anime từ AniList
 */

const RANDOM_CHARACTER_QUERY = `
query ($page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    characters(sort: FAVOURITES_DESC) {
      id
      name {
        full
        native
      }
      image {
        large
      }
      gender
      favourites
      media(perPage: 1, sort: POPULARITY_DESC) {
        nodes {
          title {
            romaji
            english
          }
          type
        }
      }
    }
  }
}
`;

export async function fetchRandomCharacter() {
  // Random page từ top 500 trang (mỗi trang 1 character) để có variety
  const randomPage = Math.floor(Math.random() * 500) + 1;

  const response = await fetch(config.anilistUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: RANDOM_CHARACTER_QUERY,
      variables: { page: randomPage, perPage: 1 }
    })
  });

  if (!response.ok) {
    throw new Error(`AniList API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`AniList GraphQL error: ${data.errors[0].message}`);
  }

  const characters = data.data?.Page?.characters;
  if (!characters || characters.length === 0) {
    throw new Error('No character found');
  }

  const char = characters[0];
  const media = char.media?.nodes?.[0];

  return {
    anilistId: char.id,
    nameRomaji: char.name?.full || 'Unknown',
    nameEnglish: char.name?.full || null,
    nameNative: char.name?.native || null,
    imageUrl: char.image?.large || '',
    sourceAnime: media?.title?.romaji || media?.title?.english || 'Unknown',
    gender: char.gender || null,
    favorites: char.favourites || 0
  };
}

const SEARCH_CHARACTER_QUERY = `
query ($search: String) {
  Character(search: $search) {
    id
    name {
      full
      native
    }
    image {
      large
    }
    gender
    favourites
    media(perPage: 1, sort: POPULARITY_DESC) {
      nodes {
        title {
          romaji
          english
        }
      }
    }
  }
}
`;

export async function searchCharacter(searchTerm) {
  const response = await fetch(config.anilistUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: SEARCH_CHARACTER_QUERY,
      variables: { search: searchTerm }
    })
  });

  if (!response.ok) {
    throw new Error(`AniList API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.errors) {
    return null; // Character not found
  }

  const char = data.data?.Character;
  if (!char) {
    return null;
  }

  const media = char.media?.nodes?.[0];

  return {
    anilistId: char.id,
    nameRomaji: char.name?.full || 'Unknown',
    nameNative: char.name?.native || null,
    imageUrl: char.image?.large || '',
    sourceAnime: media?.title?.romaji || media?.title?.english || 'Unknown',
    gender: char.gender || null,
    favorites: char.favourites || 0
  };
}

function truncateDescription(desc) {
  // Remove HTML tags and truncate to 100 chars
  const cleaned = desc.replace(/<[^>]*>/g, '').replace(/\n/g, ' ');
  return cleaned.length > 100 ? cleaned.substring(0, 97) + '...' : cleaned;
}

