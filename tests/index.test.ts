/**
 * @file tests/index.test.ts
 * @description This file contains the tests for the LastFM_handler class.
 *
 * @author Tom Planche
 * @license unlicense
 */

import LastFM_handler, {E_Period, LASTFM_ERROR_CODES, T_UserInfoRes} from "../LasfFM_handler";

describe("LastFM_handler Tests", () => {
  it("should return the same instance", () => {
    const instance1 = LastFM_handler.getInstance();
    const instance2 = LastFM_handler.getInstance();

    expect(instance1).toBe(instance2);
  });

  it("should return the same baseURL", () => {
    const instance1 = LastFM_handler.getInstance();
    const instance2 = LastFM_handler.getInstance();

    expect(instance1.baseURL).toBe(instance2.baseURL);
  });

  it("should return the same endURL", () => {
    const instance1 = LastFM_handler.getInstance();
    const instance2 = LastFM_handler.getInstance();

    expect(instance1.endURL).toBe(instance2.endURL);
  });

  it("should return the same username, no set.", () => {
    const instance1 = LastFM_handler.getInstance();
    const instance2 = LastFM_handler.getInstance();

    expect(instance1.getUsername()).toBe(instance2.getUsername());
  })

  it("should return the same username", () => {
    const instance1 = LastFM_handler.getInstance();
    const instance2 = LastFM_handler.getInstance();

    instance1.setUsername("test");

    expect(instance1.getUsername()).toBe(instance2.getUsername());
  })

  it("should return username, set differents unsernames.", () => {
    const instance1 = LastFM_handler.getInstance();
    const instance2 = LastFM_handler.getInstance();

    instance1.setUsername("test1");
    instance2.setUsername("test2");

    expect(instance1.getUsername()).toBe(instance2.getUsername())
    expect(instance1.getUsername()).toBe("test2");
  })

  it("should return User not found error", async () => {
    const instance = LastFM_handler.getInstance("TomPlanche");

    await instance.getUserInfo().catch((err) => {
      expect(err.error).toBe(LASTFM_ERROR_CODES.STATUS_INVALID_PARAMS);
    });
  });

  it("should return good user information", async () => {
    const instance = LastFM_handler.getInstance();

    instance.setUsername("tom_planche");

    const userInfo = await instance.getUserInfo();

    for (const key in userInfo) {
      const finalKey = key as keyof T_UserInfoRes;
      expect(userInfo[finalKey]).toBeDefined();
    }
  });

  it('should return top tracks (no params) ', async () => {
    const instance = LastFM_handler.getInstance();

    instance.setUsername("tom_planche");

    const response = await instance.getUserTopTracks();

    expect(response).toBeDefined();
    expect(response.toptracks).toBeDefined();
    expect(response.toptracks.track).toBeDefined();
    expect(response.toptracks["@attr"]).toBeDefined();
  });

  it('should return top tracks (params) ', async () => {
    const instance = LastFM_handler.getInstance('tom_planche');


    const response = await instance.getUserRecentTracks({
      page: 2,
      limit: 20,
    });

    expect(response).toBeDefined();
    expect(response.recenttracks).toBeDefined();
  });

  // it('should return now playing', async () => {
  //   const instance = LastFM_handler.getInstance('tom_planche');
  //
  //   const response = await instance.ifNowPlaying();
  //
  //   expect(response).toBeDefined();
  //   expect(response.mbid).toBeDefined();
  // });

  it("should return loved tracks (no params) ", async () => {
    const instance = LastFM_handler.getInstance();

    instance.setUsername("tom_planche");

    const response = await instance.getUserLovedTracks();

    expect(response).toBeDefined();
    expect(response.lovedtracks).toBeDefined();
    expect(response.lovedtracks.track).toBeDefined();
    expect(response.lovedtracks.track[0].artist).toBeDefined();
  });

  it("should catch no friends error", async () => {
    const instance = LastFM_handler.getInstance("tom_planche");

    await instance.getUserFriends().catch((err) => {
      expect(err.error).toBe(LASTFM_ERROR_CODES.STATUS_INVALID_PARAMS);
    })
  });

  it("should return user top albums (no params)", async () => {
    const instance = LastFM_handler.getInstance("tom_planche");

    const response = await instance.getUserTopAlbums();

    expect(response).toBeDefined();
    expect(response.topalbums).toBeDefined();
    expect(response.topalbums.album).toBeDefined();
  });

  it("should return user top albums (w/ params)", async () => {
    const instance = LastFM_handler.getInstance("tom_planche");

    const page = 2;
    const limit = 10;

    const response = await instance.getUserTopAlbums({
      page,
      limit,
      period: E_Period.Overall
    });

    expect(response).toBeDefined();
    expect(response.topalbums).toBeDefined();
    expect(response.topalbums.album).toBeDefined();
    expect(response.topalbums.album.length).toBe(limit);
    expect(response.topalbums["@attr"].page).toBe(+page);

  });

  it("should return user top artist (no params)", async () => {
    const instance = LastFM_handler.getInstance("tom_planche");

    const response = await instance.getUserTopArtists();

    expect(response).toBeDefined();
    expect(response.topartists).toBeDefined();
    expect(response.topartists.artist).toBeDefined();
  });

  it("should return user top artist (w/ params)", async () => {
    const instance = LastFM_handler.getInstance("tom_planche");

    const page = 2;
    const limit = 10;

    const response = await instance.getUserTopArtists({
      page,
      limit,
      period: E_Period.Overall
    });

    expect(response).toBeDefined();
    expect(response.topartists).toBeDefined();
    expect(response.topartists.artist).toBeDefined();
    expect(response.topartists.artist.length).toBe(limit);
    expect(response.topartists["@attr"].page).toBe(page);
  });

  it("should return user weekly album chart (no params)", async () => {
    const instance = LastFM_handler.getInstance("tom_planche");

    const response = await instance.getUserWeeklyAlbumChart();

    expect(response).toBeDefined();
    expect(response.weeklyalbumchart).toBeDefined();
    expect(response.weeklyalbumchart.album).toBeDefined();
  });

  it('should return user weekly album chart (w/ params)', async () => {
    const instance = LastFM_handler.getInstance("tom_planche");

    const from = Math.floor(new Date("2021-01-01").getTime() / 1000);

    const response = await instance.getUserWeeklyAlbumChart({
      from
    });

    expect(response).toBeDefined();
    expect(response.weeklyalbumchart).toBeDefined();
    expect(response.weeklyalbumchart.album).toBeDefined();
  });

  it("should return user weekly artist chart (no params)", async () => {
    const instance = LastFM_handler.getInstance("tom_planche");

    const response = await instance.getUserWeeklyArtistChart();

    expect(response).toBeDefined();
    expect(response.weeklyartistchart).toBeDefined();
    expect(response.weeklyartistchart.artist).toBeDefined();
  });

  it('should return user weekly album chart (w/ params)', async () => {
    const instance = LastFM_handler.getInstance("tom_planche");

    const from = Math.floor(new Date("2021-01-01").getTime() / 1000);

    const response = await instance.getUserWeeklyArtistChart({
      from
    });

    expect(response).toBeDefined();
    expect(response.weeklyartistchart).toBeDefined();
    expect(response.weeklyartistchart.artist).toBeDefined();
  });

  it('should return user weekly chart list - no params func', async () => {
    const instance = LastFM_handler.getInstance("tom_planche");

    const response = await instance.getUserWeeklyChartList();

    expect(response).toBeDefined();
    expect(response.weeklychartlist).toBeDefined();
    expect(response.weeklychartlist.chart).toBeDefined();
  });

  it('should return user weekly track chart (no params)', async () => {
    const instance = LastFM_handler.getInstance("tom_planche");

    const response = await instance.getUserWeeklyTrackChart();

    expect(response).toBeDefined();
    expect(response.weeklytrackchart).toBeDefined();
    expect(response.weeklytrackchart.track).toBeDefined();
  })

  it('should return user weekly track chart (w/ params)', async () => {
    const instance = LastFM_handler.getInstance("tom_planche");

    const from = Math.floor(new Date("2021-01-01").getTime() / 1000);

    const response = await instance.getUserWeeklyTrackChart({
      from
    });

    expect(response).toBeDefined();
    expect(response.weeklytrackchart).toBeDefined();
    expect(response.weeklytrackchart.track).toBeDefined();
  });

  it('should return user top tags (no params)', async () => {
    const instance = LastFM_handler.getInstance("tom_planche");

    const response = await instance.getUserTopTags();

    expect(response).toBeDefined();
    expect(response.toptags).toBeDefined();
    expect(response.toptags.tag).toBeDefined();
  });

  it('should return user top tags (no params)', async () => {
    const instance = LastFM_handler.getInstance("rj");


    const response = await instance.getUserTopTags({
      limit: 10,
    });

    console.log(response);

    expect(response).toBeDefined();
    expect(response.toptags).toBeDefined();
    expect(response.toptags.tag).toBeDefined();
    expect(response.toptags.tag.length).toBe(10);
  });
});

describe("Random tests", () => {
  type T_GoodParams = {
    page: number;
    limit: number;
    type: string;
  }
  
  it("test URLSearchParams", () => {
    const params: T_GoodParams = {
      page: 2,
      limit: 10,
      type: "photo d'identité",
    }
    
    const paramsFormatted = Object.keys(params).map((key) => {
      const finalKey = key as keyof T_GoodParams;
      return `${encodeURIComponent(finalKey)}=${encodeURIComponent(params[finalKey])}`;
    }).join('&');

    expect(paramsFormatted).toBe("page=2&limit=10&type=photo%20d'identit%C3%A9");
  })
});
