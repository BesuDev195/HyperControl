// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_quick_rick_jones.sql';
import m0001 from './0001_soft_imperial_guard.sql';
import m0002 from './0002_legal_captain_cross.sql';
import m0003 from './0003_even_beast.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003
    }
  }
  