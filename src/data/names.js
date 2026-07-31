// Name pools used to procedurally round out the roster beyond the curated
// "signature" stars. Combined combinatorially with a fixed seed (see
// players.js) so the universe is large but stable across reloads.

export const FIRST_NAMES = [
  'Marcus', 'Devon', 'Trey', 'Xavier', 'Elijah', 'Malachi', 'Jaylen', 'Deshaun',
  'Corey', 'Darnell', 'Amari', 'Jerome', 'Isaiah', 'Terrance', 'Braylon', 'Kendrick',
  'Antoine', 'Quentin', 'Reggie', 'Dominique', 'Zion', 'Cameron', 'Tyrell', 'Andre',
  'Marquis', 'Dexter', 'Julius', 'Roman', 'Sterling', 'Maurice', 'Deion', 'Calvin',
  'Emmitt', 'Barry', 'Terrell', 'Randall', 'Warrick', 'Chad', 'Keyshawn', 'Plaxico',
  'Hollis', 'Santonio', 'Torry', 'Braylen', 'Kadarius', 'Jamison', 'Delshawn', 'Ronnie',
  'Wesley', 'Grady', 'Colton', 'Beckett', 'Hudson', 'Weston', 'Griffin', 'Maxwell',
  'Preston', 'Tucker', 'Landon', 'Bryce', 'Chase', 'Dawson', 'Easton', 'Gunnar',
  'Holden', 'Jaxon', 'Kellen', 'Lincoln', 'Mason', 'Nolan', 'Owen', 'Parker',
  'Quinlan', 'Rhett', 'Shane', 'Tanner', 'Vaughn', 'Wyatt', 'Zachary', 'Aidan',
  'Brady', 'Cody', 'Dallas', 'Ezra', 'Felix', 'Garrett', 'Harlan', 'Ira',
  'Jasper', 'Knox', 'Lane', 'Miles', 'Nash', 'Orion', 'Paxton', 'Quincy',
  'Ridge', 'Silas', 'Titus', 'Uriah', 'Vance', 'Walker', 'Yusuf', 'Zane',
  'Aaron', 'Blaine', 'Cassius', 'Duke', 'Emery', 'Foster', 'Gideon', 'Hank',
  'Ivan', 'Jonah', 'Kobe', 'Lamont', 'Milo', 'Norris', 'Otis', 'Percy',
];

export const LAST_NAMES = [
  'Winters', 'Holloway', 'Ashford', 'Bramwell', 'Castellan', 'Dunmore', 'Ellery', 'Fenwick',
  'Garrison', 'Hargrove', 'Ingram', 'Jorgensen', 'Kessler', 'Larkspur', 'Mercer', 'Norwood',
  'Ostrander', 'Pemberton', 'Quarles', 'Radcliffe', 'Sutcliffe', 'Thackeray', 'Underhill', 'Vandergriff',
  'Wexford', 'Yarnell', 'Zellman', 'Ambrose', 'Blackwood', 'Cavanaugh', 'Drummond', 'Everhart',
  'Farrow', 'Gantry', 'Hollister', 'Ivester', 'Jessup', 'Kingsley', 'Loveridge', 'Marsden',
  'Nettleton', 'Oakes', 'Pruitt', 'Quimby', 'Rutledge', 'Stanmore', 'Tremaine', 'Upshaw',
  'Vickers', 'Wakefield', 'Yardley', 'Ziegler', 'Abbington', 'Braithwaite', 'Colby', 'Deacon',
  'Eastwick', 'Falconer', 'Grissom', 'Hatchett', 'Islington', 'Jamerson', 'Kilbride', 'Lassiter',
  'Merriweather', 'Norcross', 'Ockham', 'Pennington', 'Quintrell', 'Ravensworth', 'Stallworth', 'Turnbull',
  'Underwood', 'Vantassel', 'Whitlock', 'Yancey', 'Ziegfeld', 'Ashby', 'Bellweather', 'Crestwood',
  'Dashiell', 'Eldridge', 'Fairbanks', 'Galloway', 'Hendricks', 'Ivory', 'Jettison', 'Kirkland',
  'Lowery', 'Montrose', 'Northgate', 'Ostberg', 'Prescott', 'Quillan', 'Rosewood', 'Stryker',
  'Thornbury', 'Uttermark', 'Voss', 'Wrenfield', 'Yeoman', 'Zoric', 'Ainsley', 'Barrowman',
  'Cresswell', 'Dunwoody', 'Emberly', 'Frobisher', 'Goldwyn', 'Harkness', 'Ironside', 'Jessamine',
];

export const POSITIONS = [
  { code: 'QB', label: 'Quarterback', weight: 7 },
  { code: 'RB', label: 'Running Back', weight: 10 },
  { code: 'WR', label: 'Wide Receiver', weight: 16 },
  { code: 'TE', label: 'Tight End', weight: 8 },
  { code: 'OT', label: 'Offensive Tackle', weight: 6 },
  { code: 'OG', label: 'Offensive Guard', weight: 5 },
  { code: 'C', label: 'Center', weight: 3 },
  { code: 'DE', label: 'Defensive End', weight: 8 },
  { code: 'DT', label: 'Defensive Tackle', weight: 7 },
  { code: 'LB', label: 'Linebacker', weight: 11 },
  { code: 'CB', label: 'Cornerback', weight: 11 },
  { code: 'S', label: 'Safety', weight: 7 },
  { code: 'K', label: 'Kicker', weight: 2 },
  { code: 'P', label: 'Punter', weight: 2 },
];

export const NICKNAME_PREFIXES = [
  '', '', '', '', 'Big ', 'Lil\' ', 'Iron ', 'Flash ', 'Smooth ', 'Thunder ',
];
