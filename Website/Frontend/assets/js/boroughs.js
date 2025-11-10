// London Boroughs Data and Template Rendering

const boroughsData = [
    {
        name: "Barking and Dagenham",
        slug: "barking-and-dagenham",
        description: "A rapidly developing borough with a rich industrial heritage and growing residential areas",
        imageId: 101
    },
    {
        name: "Barnet",
        slug: "barnet",
        description: "Home to historic landmarks like Hadley Wood and a mix of suburban charm and urban amenities",
        imageId: 102
    },
    {
        name: "Bexley",
        slug: "bexley",
        description: "Known for its green spaces and riverside locations, offering a peaceful London lifestyle",
        imageId: 103
    },
    {
        name: "Brent",
        slug: "brent",
        description: "Host to Wembley Stadium and a diverse community with vibrant cultural offerings",
        imageId: 104
    },
    {
        name: "Bromley",
        slug: "bromley",
        description: "London's largest borough was once home to Charles Darwin, and the relocated Crystal Palace",
        imageId: 135
    },
    {
        name: "Camden",
        slug: "camden",
        description: "Best known for its market and music scene, Camden has room for the British Museum too",
        imageId: 106
    },
    {
        name: "Croydon",
        slug: "croydon",
        description: "South London's major business district with a growing skyline and excellent transport links",
        imageId: 107
    },
    {
        name: "Ealing",
        slug: "ealing",
        description: "Famous for its film studios and \"Queen of the Suburbs\" reputation with leafy streets",
        imageId: 108
    },
    {
        name: "Enfield",
        slug: "enfield",
        description: "Home to Trent Park and a mix of urban areas and rural green belt land",
        imageId: 109
    },
    {
        name: "Greenwich",
        slug: "greenwich",
        description: "Famous for the Prime Meridian, Cutty Sark, and historic Royal Naval College",
        imageId: 110
    },
    {
        name: "Hackney",
        slug: "hackney",
        description: "A trendy borough with vibrant street art, independent shops, and creative spaces",
        imageId: 111
    },
    {
        name: "Hammersmith and Fulham",
        slug: "hammersmith-and-fulham",
        description: "Known for its riverside locations, excellent shopping, and sports venues",
        imageId: 112
    },
    {
        name: "Haringey",
        slug: "haringey",
        description: "Home to Tottenham Hotspur Stadium and the leafy Alexandra Palace grounds",
        imageId: 113
    },
    {
        name: "Harrow",
        slug: "harrow",
        description: "Famous for Harrow School and its suburban character with good educational facilities",
        imageId: 114
    },
    {
        name: "Havering",
        slug: "havering",
        description: "Known for its rural feel, with large areas of green space and good transport links",
        imageId: 115
    },
    {
        name: "Hillingdon",
        slug: "hillingdon",
        description: "Home to Heathrow Airport and extensive parklands including Ruislip Lido",
        imageId: 116
    },
    {
        name: "Hounslow",
        slug: "hounslow",
        description: "Includes Heathrow's southern terminals and historic sites like Osterley Park",
        imageId: 117
    },
    {
        name: "Islington",
        slug: "islington",
        description: "Known for its vibrant restaurant scene, Upper Street, and literary history",
        imageId: 118
    },
    {
        name: "Kensington and Chelsea",
        slug: "kensington-and-chelsea",
        description: "One of London's most affluent areas, home to Kensington Palace and Harrods",
        imageId: 133
    },
    {
        name: "Kingston upon Thames",
        slug: "kingston-upon-thames",
        description: "A historic market town with a riverside location and excellent shopping facilities",
        imageId: 120
    },
    {
        name: "Lambeth",
        slug: "lambeth",
        description: "Home to the London Eye, South Bank Centre, and Brixton's diverse community",
        imageId: 121
    },
    {
        name: "Lewisham",
        slug: "lewisham",
        description: "A developing borough with a vibrant market and good transport connections to central London",
        imageId: 122
    },
    {
        name: "Merton",
        slug: "merton",
        description: "Famous for Wimbledon Tennis Championships and extensive green spaces",
        imageId: 123
    },
    {
        name: "Newham",
        slug: "newham",
        description: "Hosted the 2012 Olympics and is undergoing major regeneration around the Queen Elizabeth Olympic Park",
        imageId: 124
    },
    {
        name: "Redbridge",
        slug: "redbridge",
        description: "Known for its parks, including Epping Forest, and good schools",
        imageId: 125
    },
    {
        name: "Richmond upon Thames",
        slug: "richmond-upon-thames",
        description: "Famous for Richmond Park, Kew Gardens, and its scenic riverside locations",
        imageId: 126
    },
    {
        name: "Southwark",
        slug: "southwark",
        description: "Home to Shakespeare's Globe, Borough Market, and Tower Bridge",
        imageId: 127
    },
    {
        name: "Sutton",
        slug: "sutton",
        description: "Known for its green spaces, good schools, and suburban character",
        imageId: 128
    },
    {
        name: "Tower Hamlets",
        slug: "tower-hamlets",
        description: "Includes Canary Wharf, Brick Lane, and the historic Tower of London",
        imageId: 129
    },
    {
        name: "Waltham Forest",
        slug: "waltham-forest",
        description: "London's first Borough of Culture, with a rich industrial heritage and green spaces",
        imageId: 130
    },
    {
        name: "Wandsworth",
        slug: "wandsworth",
        description: "Known for Battersea Park, the Power Station redevelopment, and riverside living",
        imageId: 131
    },
    {
        name: "Westminster",
        slug: "city-of-westminster",
        description: "Home to the Houses of Parliament, Chinatown and London's theatreland",
        imageId: 132
    }
];

// Template function to create a borough card
function createBoroughCard(borough) {
    return `
        <a href="boroughs/borough-detail.html?borough=${borough.slug}" class="borough-card-link">
            <div class="borough-card">
                <img src="https://picsum.photos/id/${borough.imageId}/600/400" alt="${borough.name}">
                <div class="borough-card-content">
                    <h3>${borough.name}</h3>
                    <p>${borough.description}</p>
                </div>
            </div>
        </a>
    `;
}

// Render all borough cards
function renderBoroughCards() {
    const container = document.getElementById('boroughCardsContainer');
    if (!container) return;

    const html = boroughsData.map(borough => createBoroughCard(borough)).join('');
    container.innerHTML = html;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', renderBoroughCards);