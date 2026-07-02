import { Coordinates, CalculationMethod, PrayerTimes, SunnahTimes } from 'adhan';

export const calculatePrayerTimes = (latitude, longitude, date = new Date()) => {
  const coordinates = new Coordinates(latitude, longitude);
  // Using Muslim World League or Umm al-Qura as a general calculation, usually Shia apps use specific calculations (e.g. Leva Institute, Qum or Jafari), but adhan library might have it.
  // We'll use a generic one for now and configure later if needed.
  let params = CalculationMethod.Tehran();
  
  const prayerTimes = new PrayerTimes(coordinates, date, params);
  const sunnahTimes = new SunnahTimes(prayerTimes);
  
  return {
    fajr: prayerTimes.fajr,
    sunrise: prayerTimes.sunrise,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha,
    midnight: sunnahTimes.middleOfTheNight
  };
};
