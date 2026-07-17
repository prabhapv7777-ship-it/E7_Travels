import React, { useState, useEffect } from 'react';
import { Award, Printer, Search, FileText, AlertTriangle, Shield, Landmark, Globe } from 'lucide-react';

interface RuleItem {
  id: string;
  number: string;
  text: string;      // Tamil
  textEn: string;    // English
  category: 'payment' | 'conduct' | 'gps' | 'safety' | 'general';
  categoryLabel: string;
  categoryLabelEn: string;
  severity: 'high' | 'medium' | 'info';
}

export default function RulesView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lang, setLang] = useState<'ta' | 'en'>('ta');
  const [printScope, setPrintScope] = useState<'all' | 'filtered'>('all');
  const [printLang, setPrintLang] = useState<'ta' | 'en' | 'bilingual'>('bilingual');
  const [includeSignatures, setIncludeSignatures] = useState<boolean>(true);
  const [printDensity, setPrintDensity] = useState<'standard' | 'compact' | 'super-compact'>('compact');
  const [isInIframe, setIsInIframe] = useState(false);
  const [printError, setPrintError] = useState(false);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }
  }, []);

  const customLogo = localStorage.getItem('e7_custom_logo') || null;

  const rules: RuleItem[] = [
    {
      id: 'rule-1',
      number: '1',
      text: 'வண்டியின் முதல் மாதப் பேமெண்ட்டில் (Payment) ரூ. 3,000 பிணைப்புத் தொகை (Caution Deposit) பிடித்தம் செய்யப்படும். வாகனத்தை நிறுவனத்திலிருந்து வெளியேற்றும்போது, விலகல் படிவத்தை (Exit Form) பூர்த்தி செய்த 60 நாட்களுக்குள் இப்பணம் திரும்பத் தரப்படும். சொந்த எரிபொருள் (Own Fuel) வாகனங்களுக்கு ரூ. 1,500 பிணைப்புத் தொகை பிடித்தம் செய்யப்படும்.',
      textEn: 'A caution deposit of ₹3,000 will be deducted from the vehicle\'s first month\'s payment. When the vehicle is removed from the company, this amount will be refunded within 60 days of completing the Exit Form. For self-fueling (Own Fuel) vehicles, a caution deposit of ₹1,500 will be deducted.',
      category: 'payment',
      categoryLabel: 'பிணைப்புத் தொகை & பணம் (Deposit & Payments)',
      categoryLabelEn: 'Caution Deposit & Payments',
      severity: 'medium',
    },
    {
      id: 'rule-2',
      number: '2',
      text: 'E7 TRAVELS நிறுவனத்திலிருந்து வாகனத்தை வெளியேற்றிய பிறகு, இறுதி பேமெண்ட் (Final Payment) பெற்ற பின்புதான் விலகல் படிவத்தைப் (Exit Form) பூர்த்தி செய்து தர வேண்டும். இறுதிப் பேமெண்ட் பெற்ற நாளிலிருந்து 2 மாதங்களுக்குள் இப்புடிவத்தை எழுதித் தர வேண்டும்; தவறினால் பிணைப்புத் தொகை (Caution Deposit) திரும்பித் தரப்பட மாட்டாது. E7 TRAVELS அலுவலகப் பணி நேரத்தில் (காலை 10:00 மணி முதல் மாலை 6:00 மணி வரை) நேரில் வந்து விலகல் படிவத்தைப் பூர்த்தி செய்ய வேண்டும். நிறுவனத்திடம் திரும்ப ஒப்படைக்க வேண்டிய பொருட்களான GPS சாதனம், ஓட்டுநர் அடையாள அட்டை (Driver ID Card), வாகனப் பார்க்கிங் பாஸ் (Parking Pass), மெப்ஸ் நுழைவுச் சீட்டு (MEPS Entry Pass - உங்களிடம் பணம் பிடிக்கப்பட்டு பாஸ் எடுக்கப்பட்டிருந்தால் மட்டும்), E7 TRAVELS ஸ்டிக்கர், நிறுவன ஸ்பீக்கர், டிரிப் ஷீட் புக் (Trip Sheet Book) மற்றும் டிரிப் கார்டு (Trip Card) போன்றவற்றை முழுமையாக ஒப்படைத்த பிறகே விலகல் படிவம் ஏற்றுக்கொள்ளப்படும்.',
      textEn: 'After removing the vehicle from E7 TRAVELS, the Exit Form must be submitted only after receiving the final payment. This form must be completed within 2 months of the final payment; otherwise, the Caution Deposit will not be refunded. The exit form must be filled in person during working hours (10:00 AM to 6:00 PM). It will only be accepted after returning all company properties: GPS device, Driver ID Card, Parking Pass, MEPS Entry Pass (if issued with fee deduction), E7 TRAVELS sticker, company speaker, Trip Sheet Book, and Trip Card.',
      category: 'payment',
      categoryLabel: 'பிணைப்புத் தொகை & பணம் (Deposit & Payments)',
      categoryLabelEn: 'Caution Deposit & Payments',
      severity: 'high',
    },
    {
      id: 'rule-3',
      number: '3',
      text: 'பில் சமர்ப்பித்து 2 மாதங்களுக்குப் பிறகே, கிளையண்ட் நிறுவனத்தில் (Company) அனுமதி அளிக்கப்பட்ட (Pass செய்யப்பட்ட) கிலோமீட்டர் (KM) தகவலை நிர்வாகப் பிரிவு (Administration) நமக்குத் தெரிவிக்கும். ஆனால், E7 TRAVELS வாகனத்திற்கான பேமெண்ட்டை முன்கூட்டியே வழங்குவதால், கிளையண்ட் நிறுவனம் செய்யும் கிலோமீட்டர் குறைப்புகளை (KM Deduction) வாகனத்தின் அடுத்த மாதப் பேமெண்ட்டில் E7 TRAVELS நிறுவனம் சரிசெய்து குறைத்துக் கொள்ளும்.',
      textEn: 'The client company\'s administration department notifies us of approved (Passed) kilometers (KM) only 2 months after bill submission. However, since E7 TRAVELS pays vehicles in advance, any kilometer deductions (KM Deduction) made by the client company will be adjusted and deducted by E7 TRAVELS from the vehicle\'s subsequent month\'s payment.',
      category: 'payment',
      categoryLabel: 'பிணைப்புத் தொகை & பணம் (Deposit & Payments)',
      categoryLabelEn: 'Caution Deposit & Payments',
      severity: 'medium',
    },
    {
      id: 'rule-4',
      number: '4',
      text: 'டிரிப் கார்டு (Trip Card) மேற்பார்வையாளர் (Supervisor) போடும் கையொப்பம் டிரிப் ஷீட்டைப் பெற்றுக் கொண்டதற்கான அத்தாட்சியே தவிர, அது கிலோமீட்டருக்கான (KM) உத்தரவாதம் கிடையாது. வாகனம் சென்ற பகுதிக்கு (Area) ஏற்ப, நிர்ணயிக்கப்பட்ட தரநிலையான கிலோமீட்டர் வார்ப்புருவே (Standard KM Template) வைத்து, E7 TRAVELS நிறுவனத்தின் MIS துறை அனுமதிக்கும் (Pass செய்யும்) கிலோமீட்டர் கணக்கின்படியே பேமெண்ட் வழங்கப்படும். ஓட்டுநர் டிரிப் ஷீட்டில் எழுதும் கிலோமீட்டர் கணக்கில் எடுத்துக் கொள்ளப்பட மாட்டாது. ஏதேனும் குறிப்பிட்ட பகுதிக்கான கிலோமீட்டரில் கருத்து வேறுபாடு ஏற்பட்டால், கூகுள் மேப் (Google Map) மூலம் கணக்கிடப்படும் கிலோமீட்டரே இறுதியானது (Final) எனக் கருதப்படும்.',
      textEn: 'The supervisor\'s signature on the Trip Card only confirms the receipt of the Trip Sheet; it does not guarantee the kilometers (KM) run. Payment will be released strictly according to the kilometers passed by E7 TRAVELS\' MIS department based on the Standard KM Template specified for each route/area. The kilometers written by the driver in the trip sheet will not be considered. If a dispute arises, the KM calculated via Google Maps will be final.',
      category: 'general',
      categoryLabel: 'பொதுவானவை (General Rules)',
      categoryLabelEn: 'General Rules',
      severity: 'info',
    },
    {
      id: 'rule-5',
      number: '5',
      text: 'டிரிப் முடிந்த உடனேயே டிரிப் ஷீட்டைச் சமர்ப்பிக்க வேண்டும். மறுநாளோ அல்லது தாமதமாகவோ வரும் டிரிப் ஷீட்டுகள் எந்தக் காரணத்தைக் கொண்டும் ஏற்றுக்கொள்ளப்பட மாட்டாது.',
      textEn: 'The Trip Sheet must be submitted immediately upon trip completion. Trip Sheets received the next day or late will not be accepted under any circumstances.',
      category: 'general',
      categoryLabel: 'பொதுவானவை (General Rules)',
      categoryLabelEn: 'General Rules',
      severity: 'medium',
    },
    {
      id: 'rule-6',
      number: '6',
      text: 'ஓட்டுனரை மாற்றுவதற்கு முன்பாக, பழைய ஓட்டுனரின் அடையாள அட்டையைத் (ID Card) திரும்ப ஒப்படைக்க வேண்டும். புதிய ஓட்டுனரின் ஓட்டுனர் உரிமம் (Driving License) மற்றும் இதர ஆவணங்களைச் சமர்ப்பித்து, முறையாக புதிய அடையாள அட்டை பெற்ற பிறகே வாகனத்தை இயக்க அனுமதிக்க வேண்டும். E7 TRAVELS அலுவலகத்தில் அடையாள அட்டை பெறாமல் ஓட்டுனர் வாகனத்தை இயக்குவது கண்டறியப்பட்டால் ரூ. 1,000 அபராதம் விதிக்கப்படும்.',
      textEn: 'Before replacing a driver, the old driver\'s ID Card must be returned. The new driver must submit their Driving License and other documents, and can operate the vehicle only after a new ID card is formally issued. Operating a vehicle without obtaining an ID card from the E7 TRAVELS office will attract a fine of ₹1,000.',
      category: 'conduct',
      categoryLabel: 'ஓட்டுநர் & ஒழுங்குமுறை (Driver & Conduct)',
      categoryLabelEn: 'Driver & Conduct',
      severity: 'high',
    },
    {
      id: 'rule-7',
      number: '7',
      text: 'முன்அனுமதியின்றி எந்தக் காரணத்தைக் கொண்டும் விடுப்பு (Leave) எடுக்கக் கூடாது. விடுப்போ அல்லது அனுமதியோ (Permission) தேவைப்பட்டால், இரண்டு நாட்களுக்கு முன்பே பிரிவுப் பொறுப்பாளரிடம் (Unit In-charge) கூறி முறையாக அனுமதி பெற வேண்டும். முன்அனுமதி இல்லாமல் விடுப்பு எடுக்கும் அல்லது இயக்கப்படாமல் நிறுத்தப்படும் வாகனங்களுக்கு ரூ. 1,000 அபராதம் விதிக்கப்படும்.',
      textEn: 'Prior permission is mandatory for taking leave. If leave or permission is required, the Unit In-charge must be informed at least two days in advance to obtain approval. A fine of ₹1,000 will be imposed on vehicles that take leave or remain unoperated without prior approval.',
      category: 'conduct',
      categoryLabel: 'ஓட்டுநர் & ஒழுங்குமுறை (Driver & Conduct)',
      categoryLabelEn: 'Driver & Conduct',
      severity: 'high',
    },
    {
      id: 'rule-8',
      number: '8',
      text: 'விலகல் படிவம் (Exit Form) ஏற்றுக்கொள்ளப்பட்ட 60-வது நாளில் தான் பிணைப்புத் தொகை (Caution Deposit) விடுவிக்கப்படும். E7 TRAVELS நிறுவனமே தன்னிச்சையாக வாகனத்தை வெளியேற்றினாலும், விலகல் படிவம் மற்றும் பிணைப்புத் தொகை விதிமுறைகள் முழுமையாகப் பின்பற்றப்படும்; அதன்பின்தான் பேமெண்ட் வழங்கப்படும். எந்தக் காரணத்தைக் கொண்டும் முன்கூட்டியே பேமெண்ட்டோ அல்லது பிணைப்புத் தொகையோ வழங்கப்பட மாட்டாது.',
      textEn: 'The Caution Deposit will be released only on the 60th day after the Exit Form is accepted. Even if E7 TRAVELS terminates the vehicle on its own accord, all Exit Form and Caution Deposit guidelines will be strictly followed, and only then will payment be released. No advance payment or early caution deposit refund will be given under any circumstances.',
      category: 'payment',
      categoryLabel: 'பிணைப்புத் தொகை & பணம் (Deposit & Payments)',
      categoryLabelEn: 'Caution Deposit & Payments',
      severity: 'medium',
    },
    {
      id: 'rule-9',
      number: '9',
      text: 'எழுத்துப்பூர்வமாக கடிதம் கொடுக்காமல் 5 நாட்களுக்கு மேல் வராத வாகனங்களுக்கான பேமெண்ட் (Payment) நிறுத்தி வைக்கப்படும். மேலும், நீண்ட நாள் வராமைக்கான அபராதம் (Long Absent Penalty) விதிக்கப்பட்டு, 15 நாட்கள் தாமதமாகத்தான் அந்தப் பேமெண்ட் வழங்கப்படும்.',
      textEn: 'Payments will be withheld for vehicles that remain absent for more than 5 days without submitting a written letter. In addition, a Long Absent Penalty will be charged, and the payment will be delayed by 15 days.',
      category: 'conduct',
      categoryLabel: 'ஓட்டுநர் & ஒழுங்குமுறை (Driver & Conduct)',
      categoryLabelEn: 'Driver & Conduct',
      severity: 'high',
    },
    {
      id: 'rule-10',
      number: '10',
      text: 'வாகன ஓட்டுநர் அல்லது உரிமையாளரின் தவறுகளால் (முன்னறிவிப்பற்ற விடுப்பு, பிக்-அப் தவறவிடுதல் (Missing Pickup), மொபைல் சுவிட்ச் ஆஃப் செய்தல் போன்ற காரணங்களால்) ஊழியர்கள் (Staff) சொந்தச் செலவில் கால் டாக்ஸி அல்லது ஆட்டோ மூலம் வர நேர்ந்தால், அதற்கான முழுத் தொகையும் சம்பந்தப்பட்ட வாகனத்தின் பேமெண்ட்டில் இருந்து பிடித்தம் செய்யப்படும்.',
      textEn: 'If staff employees are forced to travel by call taxi or auto-rickshaw at their own expense due to errors by the driver or vehicle owner (uninformed leave, missing a pickup, mobile switched off, etc.), the full cost of such travel will be deducted from the concerned vehicle\'s payment.',
      category: 'conduct',
      categoryLabel: 'ஓட்டுநர் & ஒழுங்குமுறை (Driver & Conduct)',
      categoryLabelEn: 'Driver & Conduct',
      severity: 'high',
    },
    {
      id: 'rule-11',
      number: '11',
      text: 'வாகனத்தில் உள்ள ஜிபிஎஸ் (GPS) ஒயரைப் பிடுங்கினால் ரூ. 5,000 அபராதமும், அவசர அழைப்புப் பொத்தானை (Panic Alert) வீணாக அழுத்தினால் ரூ. 2,000 அபராதமும் விதிக்கப்படும். அதிவேகமாகச் சென்றால் (Over Speed), ஒவ்வொரு முறையும் அதிவேகப் பதிவிற்கும் தலா ரூ. 2,000 அபராதம் விதிக்கப்படும். ஸ்டெப்னி டயர், ஸ்பிலிட் கவர்னர், டூல்கிட், தீயணைப்பு உருளை (Fire Extinguisher), குடை, டார்ச் லைட், முதலுதவி பெட்டி மற்றும் ஹேண்ட்ஸ்-ஃப்ரீ (Hands-free) வசதியுடன் கூடிய மொபைல் போன் போன்றவை வாகனத்தில் எப்பொழுதும் பயன்படுத்தும் தயார் நிலையிலேயே இருக்க வேண்டும். வாகனத்தில் E7 TRAVELS மற்றும் கிளையண்ட் நிறுவனத்தின் ஸ்டிக்கர்கள், பார்க்கிங் பாஸ் மற்றும் வாகன ஆவணங்கள் முறையாக இருக்க வேண்டும். ஓட்டுநர் முகச்சவரம் செய்து, தூய்மையான வெள்ளை நிறப் பேண்ட், வெள்ளை நிறச் சட்டை அணிந்து, சீருடையில் அடையாள அட்டையுடன் (ID Card) சுத்தமாக இருக்க வேண்டும். இவற்றில் எப்போது குறைபாடுகள் கண்டறியப்பட்டாலும், ஒவ்வொன்றிற்கும் தலா ரூ. 500 வரை அபராதம் விதிக்கப்படும்.',
      textEn: 'Unplugging or disconnecting the GPS wire will attract a fine of ₹5,000, and triggering the emergency/panic alert button unnecessarily will attract a fine of ₹2,000. For overspeeding, a fine of ₹2,000 will be charged for each instance of speed violation. Spares like stepney tire, speed governor, toolkit, fire extinguisher, umbrella, torchlight, first-aid box, and mobile phone with hands-free facility must always be kept in ready-to-use condition in the vehicle. E7 TRAVELS and client stickers, parking pass, and vehicle documents must be in order. The driver must be clean-shaven, dressed in clean white pants and a white shirt (uniform) with an ID card. Any deficiencies found in these at any time will attract a fine of up to ₹500 per item.',
      category: 'gps',
      categoryLabel: 'ஜிபிஎஸ் & பாதுகாப்பு (GPS & Safety)',
      categoryLabelEn: 'GPS & Vehicle Spares',
      severity: 'high',
    },
    {
      id: 'rule-11a',
      number: '11 (A)',
      text: 'ஜிபிஎஸ் சாதனம் தொலைந்து போனாலோ அல்லது ஜிபிஎஸ் சாதனத்தைத் திரும்ப ஒப்படைக்காமல் 15 தினங்களுக்கு மேல் விடுமுறையில் இருந்தாலோ, பேமெண்ட்டிலிருந்து ரூ. 15,000 பிடித்தம் செய்யப்பட்டு, மாற்று ஜிபிஎஸ் சாதனம் வாங்கி வேறு வாகனத்தில் பொருத்தப்படும்.',
      textEn: 'If the GPS device is lost, or if the driver is on leave for more than 15 days without returning the GPS device, ₹15,000 will be deducted from the payment, and a replacement GPS device will be purchased and fitted to another vehicle.',
      category: 'gps',
      categoryLabel: 'ஜிபிஎஸ் & பாதுகாப்பு (GPS & Safety)',
      categoryLabelEn: 'GPS & Vehicle Spares',
      severity: 'high',
    },
    {
      id: 'rule-12',
      number: '12',
      text: 'E7 TRAVELS அலுவலகத்தில் எரிபொருள் பணம் (Fuel Cash) வாங்குபவர்களுக்கு, மாதந்தோறும் அவர்களின் பேமெண்ட்டிலிருந்து 4% எரிபொருள் சேவை எஞ்சல் கட்டணம் (Fuel Service Charge), சேர்க்கைக் கட்டணம் (Admission Charge - ரூ. 200), மூலத்தில் பிடித்தம் செய்யப்படும் வரி (TDS), பெனால்டி, டிரிப் ஷீட் புத்தகக் கட்டணம் (Trip Sheet Book Charge) மற்றும் ஸ்டிக்கர் கட்டணம் போன்றவை பிடித்தம் செய்யப்படும்.',
      textEn: 'For those receiving Fuel Cash at the E7 TRAVELS office, a monthly deduction will be made from their payment for a 4% Fuel Service Charge, Admission Charge (₹200), Tax Deducted at Source (TDS), penalties, Trip Sheet Book charges, and sticker charges.',
      category: 'payment',
      categoryLabel: 'பிணைப்புத் தொகை & பணம் (Deposit & Payments)',
      categoryLabelEn: 'Caution Deposit & Payments',
      severity: 'medium',
    },
    {
      id: 'rule-13',
      number: '13',
      text: 'வாகனத்தின் ஓட்டுநர், உரிமையாளர் அல்லது அவருடைய நண்பர்/உறவினர் யாரேனும் மது அருந்திவிட்டு (குடிபோதையில்) வாகனத்தை ஓட்டினாலோ, அல்லது கிளையண்ட் நிறுவனம் மற்றும் E7 TRAVELS அலுவலகத்திற்குள் நுழைந்தாலோ ரூ. 20,000 அபராதம் விதிக்கப்படும். ஓட்டுநர் போதையில் வாகனம் ஓட்டியதாக நிறுவனம் ஊழியர்கள் புகார் அளித்தாலும் இந்த அபராதம் விதிக்கப்படும்.',
      textEn: 'If the driver, owner, or any of their friends/relatives drive the vehicle or enter the client premises or E7 TRAVELS office under the influence of alcohol (drunk), a fine of ₹20,000 will be imposed. This fine will also be levied if company employees complain that the driver drove under the influence.',
      category: 'safety',
      categoryLabel: 'பாதுகாப்பு & ஆபத்துக்கட்டுப்பாடு (Safety & Hazard)',
      categoryLabelEn: 'Safety & Hazard Control',
      severity: 'high',
    },
    {
      id: 'rule-16',
      number: '16',
      text: 'வாகன இன்டக்ஷன் (Induction) முடிந்து முதல் ரூட்டை எடுத்த நாளிலிருந்து குறைந்தபட்சம் 15 நாட்கள் வாகனம் கட்டாயமாக இயக்கப்பட்டிருக்க வேண்டும். வாகனம் இயக்கத் தொடங்கிய பிறகு 15 நாட்களுக்குள் எந்தவித முன் அறிவிப்பும் இன்றி வாகனத்தை நிறுத்தினால், அந்த வாகனத்திற்கான பேமெண்ட் வழங்கப்படாது.',
      textEn: 'After vehicle induction and commencing the first route, the vehicle must be operated for at least 15 days. If the vehicle is stopped within 15 days of operation without any prior notice, no payment will be released for that vehicle.',
      category: 'general',
      categoryLabel: 'பொதுவானவை (General Rules)',
      categoryLabelEn: 'General Rules',
      severity: 'high',
    },
    {
      id: 'rule-17',
      number: '17',
      text: 'வாகனத்தை எங்கள் நிறுவன சேவையிலிருந்து விலக்க விரும்பினால், குறைந்தபட்சம் 15 நாட்களுக்கு முன்பாக எழுத்துப்பூர்வமாக அல்லது அதிகாரப்பூர்வமாக தகவல் தெரிவிக்க வேண்டும். மேற்கண்ட முன் அறிவிப்பு வழங்கப்படாமல் வாகனம் நிறுத்தப்பட்டால், அந்த மாதத்திற்கான பேமெண்ட் வழங்கப்படாது.',
      textEn: 'If you wish to withdraw the vehicle from our company\'s service, at least 15 days\' prior written or official notice must be given. If the vehicle is stopped without the above prior notice, the payment for that month will not be made.',
      category: 'general',
      categoryLabel: 'பொதுவானவை (General Rules)',
      categoryLabelEn: 'General Rules',
      severity: 'high',
    },
    {
      id: 'rule-18',
      number: '18',
      text: 'E7 Travels நிறுவனத்தில் இணையும் அனைத்து வாகன ஓட்டுநர்களுக்கும் Background Verification (பின்னணி சரிபார்ப்பு) கட்டாயமாக மேற்கொள்ளப்படும். இந்த சரிபார்ப்பு எங்கள் நிறுவனத்தின் சார்பில் செய்யப்படும். அதற்கான கட்டணம் சம்பந்தப்பட்ட ஓட்டுநர் அல்லது வாகன உரிமையாளரின் பேமெண்ட்டிலிருந்து பிடித்தம் செய்யப்படும்.',
      textEn: 'Background Verification is mandatory for all drivers joining E7 Travels. This verification will be conducted on behalf of our company, and the fee for it will be deducted from the payment of the concerned driver or vehicle owner.',
      category: 'conduct',
      categoryLabel: 'ஓட்டுநர் & ஒழுங்குமுறை (Driver & Conduct)',
      categoryLabelEn: 'Driver & Conduct',
      severity: 'medium',
    },
    {
      id: 'rule-19',
      number: '19',
      text: 'வாகனம் ஓட்டத்திலிருந்து நிறுத்தப்பட்ட பிறகு, நிறுவனத்தின் டீசல் கூப்பனைப் பயன்படுத்தி டீசல் போடப்பட்டிருந்தால், ஒவ்வொரு முறை டீசல் போட்டதற்கும் தலா ரூ. 5,000 அபராதம் விதிக்கப்படுவதோடு, நிலுவையில் உள்ள பேமெண்ட் அல்லது பிணைப்புத் தொகையிலிருந்து (Caution Deposit) அதற்கான எரிபொருள் தொகை பிடித்தம் செய்யப்படும்.',
      textEn: 'If company diesel coupons are used to fuel the vehicle after it has been stopped from operation, a fine of ₹5,000 will be charged for each fueling instance, and the fuel cost will be deducted from the outstanding payment or caution deposit.',
      category: 'payment',
      categoryLabel: 'பிணைப்புத் தொகை & பணம் (Deposit & Payments)',
      categoryLabelEn: 'Caution Deposit & Payments',
      severity: 'high',
    },
    {
      id: 'rule-20',
      number: '20',
      text: 'மேற்பார்வையாளர் (Supervisor), நிறுவன ஊழியர்கள் (Staff) மற்றும் பாதுகாப்புப் பணியாளர்கள் (Security) யாருடனும் எந்த நேரத்திலும் வாக்குவாதத்தில் ஈடுபடக் கூடாது. அவ்வாறு ஒழுங்கீனமாக நடப்பவர்கள் மீது ஒழுங்கு நடவடிக்கை எடுக்கப்பட்டு ரூ. 20,000 அபராதம் விதிக்கப்படும்.',
      textEn: 'The driver must not argue at any time with supervisors, company employees (staff), or security personnel. Disciplinarian action will be taken and a fine of ₹20,050 will be imposed on those who behave in such an undisciplined manner.',
      category: 'conduct',
      categoryLabel: 'ஓட்டுநர் & ஒழுங்குமுறை (Driver & Conduct)',
      categoryLabelEn: 'Driver & Conduct',
      severity: 'high',
    },
    {
      id: 'rule-21',
      number: '21',
      text: 'அலட்சியக் குறைவாக வாகனத்தை ஓட்டுதல் (Rash Driving), வாகனத்தை ஓட்டும்போது தூங்குதல் (Slept while Driving) மற்றும் தடை செய்யப்பட்ட பைபாஸ் (Bypass) சாலைகளில் பயணம் செய்தல் போன்ற புகார்கள் வந்தால் ரூ. 20,000 அபராதம் விதிக்கப்படும்.',
      textEn: 'If complaints are received regarding rash driving, sleeping while driving, or traveling on restricted bypass roads, a fine of ₹20,000 will be imposed.',
      category: 'safety',
      categoryLabel: 'பாதுகாப்பு & ஆபத்துக்கட்டுப்பாடு (Safety & Hazard)',
      categoryLabelEn: 'Safety & Hazard Control',
      severity: 'high',
    },
    {
      id: 'rule-22',
      number: '22',
      text: 'எந்தக் காரணத்தைக் கொண்டும், நட்பு ரீதியாகக்கூட பெண் ஊழியர்களுக்கு (Lady Associates) குறுஞ்செய்தி (SMS), வாட்ஸ்அப் (WhatsApp) செய்தி அல்லது போன் கால் செய்தல் கூடாது. தேவையில்லாமல் ‘Hi’ என்றோ அல்லது ‘How are you’ என்றோ செய்தி அனுப்பினால் கூட ரூ. 20,000 அபராதம் (Penalty) விதிக்கப்படும்.',
      textEn: 'Under no circumstances, even in a friendly manner, should any SMS, WhatsApp message, or phone call be made to female employees (Lady Associates). Sending messages unnecessarily like \'Hi\' or \'How are you\' will also attract a penalty of ₹20,000.',
      category: 'safety',
      categoryLabel: 'பாதுகாப்பு & ஆபத்துக்கட்டுப்பாடு (Safety & Hazard)',
      categoryLabelEn: 'Safety & Hazard Control',
      severity: 'high',
    },
    {
      id: 'rule-23',
      number: '23',
      text: 'வாகன பிக்-அப் (Pickup) மற்றும் டிராப் (Drop) செய்யப்படும்போது, வெளிநபர்களை (அந்நியர்களை) வாகனத்தில் ஏற்றக் கூடாது (டிக்கெட் அடித்து சவாரி செய்யக் கூடாது). அவ்வாறு செய்வது கண்டறியப்பட்டால் ரூ. 20,000 அபராதம் விதிக்கப்படும்.',
      textEn: 'While performing pickup and drop services, external persons (strangers) must not be allowed in the vehicle (commercial/ticket-based ride-sharing is prohibited). If found doing so, a fine of ₹20,000 will be imposed.',
      category: 'safety',
      categoryLabel: 'பாதுகாப்பு & ஆபத்துக்கட்டுப்பாடு (Safety & Hazard)',
      categoryLabelEn: 'Safety & Hazard Control',
      severity: 'high',
    },
    {
      id: 'rule-24',
      number: '24',
      text: 'காலை 7 மணிக்கு முன்பாகவோ அல்லது மாலை 6 மணிக்கு பின்பாகவோ, பெண் ஊழியர்களைப் பாதுகாப்புப் பணியாளர் (Security Escort) இல்லாமல் தனியாக பிக்-அப் செய்யக் கூடாது. தவறினால் ரூ. 20,000 அபராதம் விதிக்கப்படும்.',
      textEn: 'Before 7:00 AM or after 6:00 PM, female employees must not be picked up alone without a security guard (Security Escort). Failure to comply will attract a fine of ₹20,000.',
      category: 'safety',
      categoryLabel: 'பாதுகாப்பு & ஆபத்துக்கட்டுப்பாடு (Safety & Hazard)',
      categoryLabelEn: 'Safety & Hazard Control',
      severity: 'high',
    },
    {
      id: 'rule-25',
      number: '25',
      text: 'எந்தக் காரணத்தைக் கொண்டும் பயண வழியில் (On the way) வாகனத்தை நிறுத்தக் கூடாது.',
      textEn: 'Under no circumstances should the vehicle be stopped along the transit route.',
      category: 'general',
      categoryLabel: 'பொதுவானவை (General Rules)',
      categoryLabelEn: 'General Rules',
      severity: 'info',
    },
    {
      id: 'rule-26',
      number: '26',
      text: 'ஊழியர்களை (Associate) நிறுவனத்தின் உள்ளே கொண்டு வந்துதான் இறக்கி விட வேண்டும். நிறுவன வாசலில் (Company Main Gate) எக்காரணம் கொண்டும் இறக்கி விடக்கூடாது. மீறினால், கிளையண்ட் நிறுவனம் விதிக்கும் அபராதத் தொகை (Penalty) வாகனத்தின் பேமெண்ட்டிலிருந்து பிடித்தம் செய்யப்படும்.',
      textEn: 'Employees (Associates) must be dropped off only inside the company premises. Under no circumstances should they be dropped at the company main gate. If violated, any penalty imposed by the client company will be deducted from the vehicle\'s payment.',
      category: 'safety',
      categoryLabel: 'பாதுகாப்பு & ஆபத்துக்கட்டுப்பாடு (Safety & Hazard)',
      categoryLabelEn: 'Safety & Hazard Control',
      severity: 'high',
    },
    {
      id: 'rule-27',
      number: '27',
      text: 'ஊழியர்களை அவர்களின் வீடு அல்லது நிறுவனத்தால் நியமிக்கப்பட்ட டிராப் பாயிண்ட்டில் (Drop Point) தான் இறக்கி விட வேண்டும். எந்தக் காரணத்தைக் கொண்டும் வழியில் இறக்கி விடக் கூடாது. பாதுகாப்புப் பணியாளரை (Security Escort) மீண்டும் நிறுவனத்திற்கே கொண்டு வந்து விட வேண்டும்; அவரையும் வழியில் இறக்கிவிடக் கூடாது.',
      textEn: 'Employees must be dropped only at their homes or designated drop points. Under no circumstances should they be dropped on the way. The Security Escort must be brought back to the company; they must also not be dropped on the way.',
      category: 'safety',
      categoryLabel: 'பாதுகாப்பு & ஆபத்துக்கட்டுப்பாடு (Safety & Hazard)',
      categoryLabelEn: 'Safety & Hazard Control',
      severity: 'high',
    },
    {
      id: 'rule-28',
      number: '28',
      text: 'டிரிப் ஷீட்டில் (Trip Sheet) ஓட்டுநர் எந்தக் காரணத்தைக் கொண்டும் ஊழியர்களைப் பற்றிய விவரங்களை எழுதக் கூடாது. அந்தந்த விவரங்களைச் சம்பந்தப்பட்ட ஊழியர்கள்தான் (Associates) எழுத வேண்டும். ஓட்டுநரின் பெயர், அடையாள எண் (ID) மற்றும் பகுதி (Area) போன்றவை தெளிவாக எழுதப்பட்டிருப்பதை ஓட்டுநர் உறுதி செய்ய வேண்டும்.',
      textEn: 'The driver must not write any details about the employees on the Trip Sheet under any circumstances. The respective details must be written only by the employees (Associates). The driver must ensure that their name, ID, and area are clearly written.',
      category: 'general',
      categoryLabel: 'பொதுவானவை (General Rules)',
      categoryLabelEn: 'General Rules',
      severity: 'medium',
    },
    {
      id: 'rule-29',
      number: '29',
      text: 'வாகனம் யார் பெயரில் பதிவு செய்யப்பட்டுள்ளதோ, அவர் பெயரில்தான் காசோலை (Cheque OR Bank Transfer) வழங்கப்படும். காசோலை பெரும் பெயர் மாற்றத் தேவைப்பட்டால், வாகனப் பதிவு உரிமையாளரிடமிருந்து ரூ. 20 மதிப்புள்ள முத்திரைத்தாளில் (Stamp Paper) எழுத்துப்பூர்வமான சம்மதக் கடிதம் பெற்றுத் தர வேண்டும். உறவினர் பெயருக்கு மாற்ற வேண்டும் என்றால் அதற்கான முறையான உறவுமுறைச் சான்றிதழ் சமர்ப்பிக்கப்பட வேண்டும்.',
      textEn: 'Cheque or bank transfer payments will be issued only in the name of the registered vehicle owner. If a change of payment recipient is required, a written consent letter must be provided by the registered owner on a ₹20 stamp paper. If the payment is to be transferred to a relative, a proper relationship certificate must be submitted.',
      category: 'payment',
      categoryLabel: 'பிணைப்புத் தொகை & பணம் (Deposit & Payments)',
      categoryLabelEn: 'Caution Deposit & Payments',
      severity: 'medium',
    },
  ];

  const categories = [
    { id: 'all', label: lang === 'ta' ? 'அனைத்து விதிகள் (All)' : 'All Rules' },
    { id: 'payment', label: lang === 'ta' ? 'பிணைப்புத் தொகை & பணம்' : 'Caution Deposit & Payments' },
    { id: 'conduct', label: lang === 'ta' ? 'ஓட்டுநர் & ஒழுங்குமுறை' : 'Driver & Code of Conduct' },
    { id: 'gps', label: lang === 'ta' ? 'ஜிபிஎஸ் & கருவிகள்' : 'GPS & Spares' },
    { id: 'safety', label: lang === 'ta' ? 'பாதுகாப்பு & ஆபத்துக் கட்டுப்பாடு' : 'Safety & Penalties' },
    { id: 'general', label: lang === 'ta' ? 'பொதுவானவை' : 'General Guidelines' },
  ];

  const filteredRules = rules.filter((rule) => {
    const matchesCategory = selectedCategory === 'all' || rule.category === selectedCategory;
    const ruleText = lang === 'ta' ? rule.text : rule.textEn;
    const catLabel = lang === 'ta' ? rule.categoryLabel : rule.categoryLabelEn;
    const matchesSearch =
      ruleText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.number.includes(searchTerm) ||
      catLabel.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePrint = () => {
    try {
      setPrintError(false);
      window.focus();
      window.print();
    } catch (err) {
      console.error('Print failed:', err);
      setPrintError(true);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Print Stylesheet Override */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Remove browser headers and footers (title, date/time, URL) */
          @page {
            size: auto;
            margin: 0 !important;
          }

          /* Hide standard non-print components of RulesView and App.tsx */
          aside, header, nav, .print\\:hidden, [print\\:hidden] {
            display: none !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          
          /* Reset parent layout restrictions so browser can multi-page print */
          body, html, #root, #root > div, #root > div > div, main {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            display: block !important;
          }

          /* Add safe printable margins since browser default margin is set to 0 */
          body {
            padding: ${printDensity === 'super-compact' ? '6mm 10mm 6mm 10mm' : printDensity === 'compact' ? '10mm 15mm 10mm 15mm' : '15mm 20mm 15mm 20mm'} !important;
          }

          /* Ensure content takes full print area */
          .print-sheet {
            display: block !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }

          /* Print rule item page-break safety */
          .print-rule-item {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: ${printDensity === 'super-compact' ? '4px' : printDensity === 'compact' ? '7px' : '12px'} !important;
            padding-bottom: ${printDensity === 'super-compact' ? '4px' : printDensity === 'compact' ? '7px' : '12px'} !important;
          }

          /* Font size and line heights for rules */
          .rule-num {
            font-size: ${printDensity === 'super-compact' ? '9px' : printDensity === 'compact' ? '10px' : '11px'} !important;
            width: ${printDensity === 'super-compact' ? '1.25rem' : printDensity === 'compact' ? '1.5rem' : '2rem'} !important;
          }
          .rule-text-primary {
            font-size: ${printDensity === 'super-compact' ? '9px' : printDensity === 'compact' ? '10px' : '11.5px'} !important;
            line-height: ${printDensity === 'super-compact' ? '1.2' : printDensity === 'compact' ? '1.3' : '1.45'} !important;
          }
          .rule-text-secondary {
            font-size: ${printDensity === 'super-compact' ? '8px' : printDensity === 'compact' ? '8.5px' : '9.5px'} !important;
            line-height: ${printDensity === 'super-compact' ? '1.15' : printDensity === 'compact' ? '1.25' : '1.35'} !important;
          }

          /* Header area scaling */
          .print-header {
            padding-bottom: ${printDensity === 'super-compact' ? '10px' : printDensity === 'compact' ? '15px' : '24px'} !important;
          }
          .print-header h1 {
            font-size: ${printDensity === 'super-compact' ? '13px' : printDensity === 'compact' ? '15px' : '18px'} !important;
          }
          .print-header h2 {
            font-size: ${printDensity === 'super-compact' ? '10px' : printDensity === 'compact' ? '11px' : '13px'} !important;
          }
          .print-rules-container {
            margin-top: ${printDensity === 'super-compact' ? '10px' : printDensity === 'compact' ? '15px' : '24px'} !important;
          }

          /* Signature block spacing and break safety */
          .print-signature-block {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-top: ${printDensity === 'super-compact' ? '1.5rem' : printDensity === 'compact' ? '2rem' : '3.5rem'} !important;
            gap: ${printDensity === 'super-compact' ? '0.75rem' : printDensity === 'compact' ? '1.25rem' : '1.5rem'} !important;
          }
          .print-signature-col {
            margin-bottom: 0 !important;
          }
          .print-signature-col p {
            margin-top: 0 !important;
            margin-bottom: ${printDensity === 'super-compact' ? '0.75rem' : printDensity === 'compact' ? '1.25rem' : '2.5rem'} !important;
          }
          .print-signature-col p:last-child {
            margin-bottom: 0 !important;
          }
        }
      `}} />

      {/* Preview Warning Banners */}
      {isInIframe && (
        <div className="bg-amber-500 text-slate-950 p-4 text-xs font-extrabold rounded-2xl border-2 border-amber-600 print:hidden shadow-md leading-relaxed">
          <div className="flex items-start gap-2.5">
            <span className="text-base shrink-0">💡</span>
            <p>
              <strong>Running inside the Preview Panel:</strong> Browser security restricts printer trigger actions from inside nested iframes. Please click the <strong>"Open in New Tab"</strong> button in the top-right corner of your browser screen to print or save as PDF flawlessly!
            </p>
          </div>
        </div>
      )}

      {printError && (
        <div className="bg-rose-500 text-white p-4 text-xs font-extrabold rounded-2xl border-2 border-rose-600 print:hidden shadow-md leading-relaxed">
          <div className="flex items-start gap-2.5">
            <span className="text-base shrink-0">⚠️</span>
            <p>
              <strong>Print Action Interrupted:</strong> The browser blocked printing. Click the <strong>"Open in New Tab"</strong> button in the top-right corner of the screen and run the print action from there.
            </p>
          </div>
        </div>
      )}
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-3xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl text-blue-800">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {lang === 'ta' ? 'வாகன இணைப்பு மற்றும் ஓட்டுநர்களுக்கான விதிமுறைகள்' : 'Vehicle Induction & Driver Rules'}
            </h2>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              E7 TRAVELS — {lang === 'ta' ? 'விதிமுறைகள் ஆவணம்' : 'Rules & Regulations Document'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Language Toggle Selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              onClick={() => setLang('ta')}
              className={`px-3 py-1.5 text-3xs font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                lang === 'ta' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Globe className="h-3.5 w-3.5 shrink-0 text-blue-600" /> தமிழ்
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 text-3xs font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                lang === 'en' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Globe className="h-3.5 w-3.5 shrink-0 text-amber-600" /> English
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 border border-slate-700 cursor-pointer"
          >
            <Printer className="h-4 w-4" /> {lang === 'ta' ? 'அச்சிடு / PDF சேமி' : 'Print Rules / Save PDF'}
          </button>
        </div>
      </div>

      {/* Official Print and Document Customizer Panel */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-500/15 text-blue-400 rounded-xl border border-blue-500/20">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-wide text-white uppercase">Official Print & PDF Customizer</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Configure rules directory layout before exporting or printing</p>
            </div>
          </div>
          
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center gap-2 border border-blue-400 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            {lang === 'ta' ? 'அச்சிடு / PDF சேமி' : 'Print Document / Save PDF'}
          </button>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800/80">
          {/* Option 1: Print Language */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Print Language Format</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setPrintLang('ta')}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  printLang === 'ta' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                தமிழ்
              </button>
              <button
                onClick={() => setPrintLang('en')}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  printLang === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setPrintLang('bilingual')}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  printLang === 'bilingual' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Bilingual
              </button>
            </div>
          </div>

          {/* Option 2: Rules Scope */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Included Content Scope</label>
            <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setPrintScope('all')}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  printScope === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Rules ({rules.length})
              </button>
              <button
                onClick={() => setPrintScope('filtered')}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  printScope === 'filtered' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Filtered Only ({filteredRules.length})
              </button>
            </div>
          </div>

          {/* Option 3: Signatures Toggles */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Signature Blocks</label>
            <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setIncludeSignatures(true)}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  includeSignatures ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                With Signatures
              </button>
              <button
                onClick={() => setIncludeSignatures(false)}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  !includeSignatures ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Text Only
              </button>
            </div>
          </div>

          {/* Option 4: Page Fit & Density */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Page-Fit / Print Scaling</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setPrintDensity('compact')}
                className={`py-1.5 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${
                  printDensity === 'compact' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Slightly smaller spacing and text to fit within 3 pages"
              >
                Compact (3 Pgs)
              </button>
              <button
                onClick={() => setPrintDensity('super-compact')}
                className={`py-1.5 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${
                  printDensity === 'super-compact' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Ultra tight layout and text to fit within 2 pages"
              >
                Tight (2 Pgs)
              </button>
              <button
                onClick={() => setPrintDensity('standard')}
                className={`py-1.5 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${
                  printDensity === 'standard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Default layout size, might take 4 pages"
              >
                Standard
              </button>
            </div>
          </div>
        </div>

        {/* Browser Preview Info Box */}
        <div className="flex items-start gap-2.5 bg-blue-950/40 p-3.5 rounded-xl border border-blue-900/40 text-[11px] text-blue-300">
          <span className="text-sm">💡</span>
          <p className="leading-relaxed font-sans">
            <strong>Printing from the AI Studio iframe:</strong> If the print dialog is blank or blocked by browser settings, click the <strong>"Open in New Tab"</strong> button in the top-right corner of your browser screen.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 print:hidden">
        {/* Search */}
        <div className="lg:col-span-4 relative">
          <input
            type="text"
            placeholder={lang === 'ta' ? "விதிமுறைகளைத் தேடுங்கள்..." : "Search company rules..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
          />
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
        </div>

        {/* Category buttons */}
        <div className="lg:col-span-8 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-2 text-3xs font-black rounded-lg border transition-all ${
                selectedCategory === cat.id
                  ? 'bg-blue-900 border-blue-950 text-white shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rules list */}
      <div className="space-y-4 print:hidden">
        {filteredRules.length > 0 ? (
          filteredRules.map((rule) => {
            // Severity styles
            let severityBg = 'border-l-blue-600';
            let iconColor = 'text-blue-600 bg-blue-50';

            if (rule.severity === 'high') {
              severityBg = 'border-l-red-600';
              iconColor = 'text-red-700 bg-red-50';
            } else if (rule.severity === 'medium') {
              severityBg = 'border-l-amber-500';
              iconColor = 'text-amber-700 bg-amber-50';
            } else if (rule.category === 'payment') {
              severityBg = 'border-l-emerald-600';
              iconColor = 'text-emerald-700 bg-emerald-50';
            }

            return (
              <div
                key={rule.id}
                className={`bg-white p-5 rounded-xl border border-slate-200 border-l-[6px] ${severityBg} shadow-3xs flex gap-4 transition-all hover:shadow-2xs print:border-l-[4px] print:border-slate-300 print:shadow-none print:p-3 print:rounded-none`}
              >
                <div className={`w-8 h-8 rounded-lg ${iconColor} flex items-center justify-center font-bold text-xs shrink-0 print:border print:border-slate-300`}>
                  {rule.number}
                </div>
                <div className="space-y-2 flex-1">
                  <p className="text-xs font-semibold leading-relaxed text-slate-850 font-sans tracking-wide">
                    {lang === 'ta' ? rule.text : rule.textEn}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1 print:hidden">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {lang === 'ta' ? rule.categoryLabel : rule.categoryLabelEn}
                    </span>
                    {rule.severity === 'high' && (
                      <span className="text-[9px] font-black uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                        {lang === 'ta' ? 'கண்டிப்பான விதி (Strict)' : 'Strict Rule'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 print:hidden">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-700">
              {lang === 'ta' ? 'தேடலுக்குப் பொருத்தமான விதிமுறைகள் எதுவும் கண்டறியப்படவில்லை.' : 'No matching rules found for the query.'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {lang === 'ta' ? 'வேறு ஏதேனும் முக்கிய வார்த்தையைத் தேடிப் பாருங்கள்.' : 'Try searching with another keyword.'}
            </p>
          </div>
        )}
      </div>

      {/* Printing Only Layout */}
      <div className="hidden print:block font-sans text-xs pt-12 print-sheet">
        <div className="text-center space-y-2 border-b border-double border-slate-400 pb-6 flex flex-col items-center justify-center print-header">
          {customLogo ? (
            <img src={customLogo} alt="E7 Travels" className="h-14 w-14 object-contain mb-2" referrerPolicy="no-referrer" />
          ) : (
            <div className="h-12 w-12 rounded bg-amber-500 text-slate-950 font-black text-xl border-2 border-slate-950 shadow-sm flex items-center justify-center mb-2 shrink-0">
              E7
            </div>
          )}
          <h1 className="text-lg font-black tracking-tight text-black uppercase">E7 TRAVELS CHENNAI HUB</h1>
          <h2 className="text-sm font-bold tracking-wide">
            {printLang === 'ta' && 'வாகன இணைப்பு மற்றும் ஓட்டுநர்களுக்கான விதிமுறைகள் (Rules & Regulations)'}
            {printLang === 'en' && 'Vehicle Induction & Driver Rules & Regulations'}
            {printLang === 'bilingual' && 'வாகன இணைப்பு & ஓட்டுநர் விதிமுறைகள் / Vehicle Induction & Driver Rules'}
          </h2>
          <p className="text-[10px] font-medium text-slate-500 italic">
            E7 Travels Authorized Document — {lang === 'ta' ? 'விதிமுறைகள் ஆவணம்' : 'Rules Directory Reference'}
          </p>
        </div>

        <div className="space-y-4 mt-6 print-rules-container">
          {(printScope === 'all' ? rules : filteredRules).map((rule) => (
            <div key={rule.id} className="flex gap-3 text-[11px] border-b border-slate-100 pb-3 leading-relaxed print-rule-item text-justify">
              <span className="font-bold shrink-0 text-right text-slate-700 rule-num">{rule.number}.</span>
              <div className="flex-1 space-y-1">
                {(printLang === 'ta' || printLang === 'bilingual') && (
                  <p className="font-sans font-semibold text-slate-900 rule-text-primary">{rule.text}</p>
                )}
                {(printLang === 'en' || printLang === 'bilingual') && (
                  <p className={`font-sans text-slate-600 rule-text-secondary ${printLang === 'bilingual' ? 'italic mt-0.5' : 'font-medium'}`}>
                    {rule.textEn}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Print Signature block */}
        {includeSignatures && (
          <div className="grid grid-cols-3 gap-6 pt-16 text-[10px] print-signature-block">
            <div className="space-y-12 print-signature-col">
              <p className="font-bold">Owner Name: _________________</p>
              <p className="font-bold">Owner Signature: ______________</p>
              <p className="font-bold">Date: _________________</p>
            </div>
            <div className="space-y-12 print-signature-col">
              <p className="font-bold">Driver Name: _________________</p>
              <p className="font-bold">Driver Signature: ______________</p>
              <p className="font-bold">Date: _________________</p>
            </div>
            <div className="space-y-12 flex flex-col justify-end">
              <p className="font-extrabold text-right text-[11px]">E7 TRAVELS AUTHORIZED SIGNATURE</p>
              <p className="text-slate-400 text-right italic">(Office Seal & Signature)</p>
            </div>
          </div>
        )}

        {includeSignatures && (
          <div className="pt-12 text-center text-3xs text-slate-400 italic">
            {lang === 'ta' 
              ? 'மேலே குறிப்பிட்ட அனைத்து விதிமுறைகளையும் நான் மனப்பூர்வமாக ஏற்றுக் கொள்கிறேன்.' 
              : 'I hereby accept all the above mentioned rules and regulations wholeheartedly.'}
          </div>
        )}
      </div>

    </div>
  );
}
