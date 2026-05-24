'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

// Supported languages with African focus
export type SupportedLanguage = 
  | 'en' // English
  | 'fr' // French
  | 'sw' // Swahili
  | 'ar' // Arabic
  | 'pt' // Portuguese
  | 'am' // Amharic
  | 'ha' // Hausa
  | 'yo' // Yoruba
  | 'zu' // Zulu
  | 'ig' // Igbo
  | 'so' // Somali
  | 'rw' // Kinyarwanda;

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
  countries: string[];
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: 'GB', direction: 'ltr', countries: ['Nigeria', 'Kenya', 'Ghana', 'South Africa', 'Uganda'] },
  { code: 'fr', name: 'French', nativeName: 'Francais', flag: 'FR', direction: 'ltr', countries: ['Senegal', 'Ivory Coast', 'Cameroon', 'DR Congo', 'Morocco'] },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: 'KE', direction: 'ltr', countries: ['Kenya', 'Tanzania', 'Uganda', 'Rwanda'] },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: 'EG', direction: 'rtl', countries: ['Egypt', 'Morocco', 'Algeria', 'Sudan', 'Tunisia'] },
  { code: 'pt', name: 'Portuguese', nativeName: 'Portugues', flag: 'PT', direction: 'ltr', countries: ['Mozambique', 'Angola', 'Cape Verde'] },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: 'ET', direction: 'ltr', countries: ['Ethiopia'] },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: 'NG', direction: 'ltr', countries: ['Nigeria', 'Niger', 'Ghana'] },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yoruba', flag: 'NG', direction: 'ltr', countries: ['Nigeria', 'Benin', 'Togo'] },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: 'ZA', direction: 'ltr', countries: ['South Africa'] },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo', flag: 'NG', direction: 'ltr', countries: ['Nigeria'] },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali', flag: 'SO', direction: 'ltr', countries: ['Somalia', 'Djibouti', 'Ethiopia'] },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', flag: 'RW', direction: 'ltr', countries: ['Rwanda'] },
];

// Common UI translations
export const UI_TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.courses': 'Courses',
    'nav.my_learning': 'My Learning',
    'nav.messages': 'Messages',
    'nav.skills': 'Skills',
    'nav.careers': 'Careers',
    'nav.community': 'Community',
    'nav.settings': 'Settings',
    'nav.help': 'Help',
    'nav.logout': 'Log out',
    
    // Common
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.download': 'Download',
    'common.share': 'Share',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.submit': 'Submit',
    'common.continue': 'Continue',
    'common.start': 'Start',
    'common.finish': 'Finish',
    'common.close': 'Close',
    
    // Auth
    'auth.login': 'Log in',
    'auth.signup': 'Sign up',
    'auth.logout': 'Log out',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.forgot_password': 'Forgot password?',
    'auth.remember_me': 'Remember me',
    'auth.create_account': 'Create account',
    'auth.already_have_account': 'Already have an account?',
    'auth.dont_have_account': "Don't have an account?",
    
    // Courses
    'course.enroll': 'Enroll Now',
    'course.enrolled': 'Enrolled',
    'course.start_learning': 'Start Learning',
    'course.continue': 'Continue',
    'course.completed': 'Completed',
    'course.certificate': 'Certificate',
    'course.lessons': 'Lessons',
    'course.duration': 'Duration',
    'course.level': 'Level',
    'course.instructor': 'Instructor',
    'course.students': 'Students',
    'course.rating': 'Rating',
    'course.reviews': 'Reviews',
    'course.curriculum': 'Curriculum',
    'course.overview': 'Overview',
    'course.free': 'Free',
    
    // Dashboard
    'dashboard.welcome': 'Welcome back',
    'dashboard.continue_learning': 'Continue Learning',
    'dashboard.your_progress': 'Your Progress',
    'dashboard.recent_activity': 'Recent Activity',
    'dashboard.recommended': 'Recommended for you',
    'dashboard.achievements': 'Achievements',
    
    // Settings
    'settings.profile': 'Profile',
    'settings.notifications': 'Notifications',
    'settings.privacy': 'Privacy',
    'settings.appearance': 'Appearance',
    'settings.language': 'Language',
    'settings.security': 'Security',
    'settings.billing': 'Billing',
    
    // Theme
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',
    
    // Language
    'language.select': 'Select Language',
    'language.auto_translate': 'Auto-translate content',
    'language.translate_to_english': 'Translate to English',
  },
  
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.courses': 'Cours',
    'nav.my_learning': 'Mon apprentissage',
    'nav.messages': 'Messages',
    'nav.skills': 'Competences',
    'nav.careers': 'Carrieres',
    'nav.community': 'Communaute',
    'nav.settings': 'Parametres',
    'nav.help': 'Aide',
    'nav.logout': 'Deconnexion',
    
    // Common
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.sort': 'Trier',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.view': 'Voir',
    'common.download': 'Telecharger',
    'common.share': 'Partager',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succes',
    'common.confirm': 'Confirmer',
    'common.back': 'Retour',
    'common.next': 'Suivant',
    'common.previous': 'Precedent',
    'common.submit': 'Soumettre',
    'common.continue': 'Continuer',
    'common.start': 'Commencer',
    'common.finish': 'Terminer',
    'common.close': 'Fermer',
    
    // Auth
    'auth.login': 'Connexion',
    'auth.signup': "S'inscrire",
    'auth.logout': 'Deconnexion',
    'auth.email': 'E-mail',
    'auth.password': 'Mot de passe',
    'auth.forgot_password': 'Mot de passe oublie ?',
    'auth.remember_me': 'Se souvenir de moi',
    'auth.create_account': 'Creer un compte',
    'auth.already_have_account': 'Vous avez deja un compte ?',
    'auth.dont_have_account': "Vous n'avez pas de compte ?",
    
    // Courses
    'course.enroll': "S'inscrire maintenant",
    'course.enrolled': 'Inscrit',
    'course.start_learning': "Commencer l'apprentissage",
    'course.continue': 'Continuer',
    'course.completed': 'Termine',
    'course.certificate': 'Certificat',
    'course.lessons': 'Lecons',
    'course.duration': 'Duree',
    'course.level': 'Niveau',
    'course.instructor': 'Instructeur',
    'course.students': 'Etudiants',
    'course.rating': 'Note',
    'course.reviews': 'Avis',
    'course.curriculum': 'Programme',
    'course.overview': 'Apercu',
    'course.free': 'Gratuit',
    
    // Dashboard
    'dashboard.welcome': 'Bon retour',
    'dashboard.continue_learning': 'Continuer a apprendre',
    'dashboard.your_progress': 'Votre progression',
    'dashboard.recent_activity': 'Activite recente',
    'dashboard.recommended': 'Recommande pour vous',
    'dashboard.achievements': 'Realisations',
    
    // Settings
    'settings.profile': 'Profil',
    'settings.notifications': 'Notifications',
    'settings.privacy': 'Confidentialite',
    'settings.appearance': 'Apparence',
    'settings.language': 'Langue',
    'settings.security': 'Securite',
    'settings.billing': 'Facturation',
    
    // Theme
    'theme.light': 'Clair',
    'theme.dark': 'Sombre',
    'theme.system': 'Systeme',
    
    // Language
    'language.select': 'Choisir la langue',
    'language.auto_translate': 'Traduction automatique du contenu',
    'language.translate_to_english': 'Traduire en anglais',
  },
  
  sw: {
    // Navigation
    'nav.home': 'Nyumbani',
    'nav.courses': 'Kozi',
    'nav.my_learning': 'Masomo Yangu',
    'nav.messages': 'Ujumbe',
    'nav.skills': 'Ujuzi',
    'nav.careers': 'Kazi',
    'nav.community': 'Jamii',
    'nav.settings': 'Mipangilio',
    'nav.help': 'Msaada',
    'nav.logout': 'Ondoka',
    
    // Common
    'common.search': 'Tafuta',
    'common.filter': 'Chuja',
    'common.sort': 'Panga',
    'common.save': 'Hifadhi',
    'common.cancel': 'Ghairi',
    'common.delete': 'Futa',
    'common.edit': 'Hariri',
    'common.view': 'Tazama',
    'common.download': 'Pakua',
    'common.share': 'Shiriki',
    'common.loading': 'Inapakia...',
    'common.error': 'Hitilafu',
    'common.success': 'Mafanikio',
    'common.confirm': 'Thibitisha',
    'common.back': 'Rudi',
    'common.next': 'Ifuatayo',
    'common.previous': 'Iliyotangulia',
    'common.submit': 'Wasilisha',
    'common.continue': 'Endelea',
    'common.start': 'Anza',
    'common.finish': 'Maliza',
    'common.close': 'Funga',
    
    // Auth
    'auth.login': 'Ingia',
    'auth.signup': 'Jisajili',
    'auth.logout': 'Ondoka',
    'auth.email': 'Barua pepe',
    'auth.password': 'Nenosiri',
    'auth.forgot_password': 'Umesahau nenosiri?',
    'auth.remember_me': 'Nikumbuke',
    'auth.create_account': 'Fungua akaunti',
    'auth.already_have_account': 'Una akaunti tayari?',
    'auth.dont_have_account': 'Huna akaunti?',
    
    // Courses
    'course.enroll': 'Jiandikishe Sasa',
    'course.enrolled': 'Umejiandikisha',
    'course.start_learning': 'Anza Kujifunza',
    'course.continue': 'Endelea',
    'course.completed': 'Imekamilika',
    'course.certificate': 'Cheti',
    'course.lessons': 'Masomo',
    'course.duration': 'Muda',
    'course.level': 'Kiwango',
    'course.instructor': 'Mkufunzi',
    'course.students': 'Wanafunzi',
    'course.rating': 'Ukadiriaji',
    'course.reviews': 'Maoni',
    'course.curriculum': 'Mtaala',
    'course.overview': 'Muhtasari',
    'course.free': 'Bure',
    
    // Dashboard
    'dashboard.welcome': 'Karibu tena',
    'dashboard.continue_learning': 'Endelea Kujifunza',
    'dashboard.your_progress': 'Maendeleo Yako',
    'dashboard.recent_activity': 'Shughuli za Hivi Karibuni',
    'dashboard.recommended': 'Iliyopendekezwa kwako',
    'dashboard.achievements': 'Mafanikio',
    
    // Settings
    'settings.profile': 'Wasifu',
    'settings.notifications': 'Arifa',
    'settings.privacy': 'Faragha',
    'settings.appearance': 'Muonekano',
    'settings.language': 'Lugha',
    'settings.security': 'Usalama',
    'settings.billing': 'Malipo',
    
    // Theme
    'theme.light': 'Mwanga',
    'theme.dark': 'Giza',
    'theme.system': 'Mfumo',
    
    // Language
    'language.select': 'Chagua Lugha',
    'language.auto_translate': 'Tafsiri maudhui kiotomatiki',
    'language.translate_to_english': 'Tafsiri kwa Kiingereza',
  },
  
  // Simplified entries for other languages (same keys)
  ar: {
    'nav.home': 'الرئيسية',
    'nav.courses': 'الدورات',
    'nav.my_learning': 'تعلمي',
    'nav.messages': 'الرسائل',
    'nav.skills': 'المهارات',
    'nav.careers': 'الوظائف',
    'nav.community': 'المجتمع',
    'nav.settings': 'الإعدادات',
    'nav.help': 'المساعدة',
    'nav.logout': 'تسجيل الخروج',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.sort': 'ترتيب',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.view': 'عرض',
    'common.download': 'تحميل',
    'common.share': 'مشاركة',
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجاح',
    'common.confirm': 'تأكيد',
    'common.back': 'رجوع',
    'common.next': 'التالي',
    'common.previous': 'السابق',
    'common.submit': 'إرسال',
    'common.continue': 'متابعة',
    'common.start': 'بدء',
    'common.finish': 'إنهاء',
    'common.close': 'إغلاق',
    'auth.login': 'تسجيل الدخول',
    'auth.signup': 'إنشاء حساب',
    'auth.logout': 'تسجيل الخروج',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.forgot_password': 'نسيت كلمة المرور؟',
    'auth.remember_me': 'تذكرني',
    'auth.create_account': 'إنشاء حساب',
    'auth.already_have_account': 'لديك حساب بالفعل؟',
    'auth.dont_have_account': 'ليس لديك حساب؟',
    'course.enroll': 'سجل الآن',
    'course.enrolled': 'مسجل',
    'course.start_learning': 'ابدأ التعلم',
    'course.continue': 'متابعة',
    'course.completed': 'مكتمل',
    'course.certificate': 'شهادة',
    'course.lessons': 'الدروس',
    'course.duration': 'المدة',
    'course.level': 'المستوى',
    'course.instructor': 'المدرب',
    'course.students': 'الطلاب',
    'course.rating': 'التقييم',
    'course.reviews': 'المراجعات',
    'course.curriculum': 'المنهج',
    'course.overview': 'نظرة عامة',
    'course.free': 'مجاني',
    'dashboard.welcome': 'مرحباً بعودتك',
    'dashboard.continue_learning': 'متابعة التعلم',
    'dashboard.your_progress': 'تقدمك',
    'dashboard.recent_activity': 'النشاط الأخير',
    'dashboard.recommended': 'موصى به لك',
    'dashboard.achievements': 'الإنجازات',
    'settings.profile': 'الملف الشخصي',
    'settings.notifications': 'الإشعارات',
    'settings.privacy': 'الخصوصية',
    'settings.appearance': 'المظهر',
    'settings.language': 'اللغة',
    'settings.security': 'الأمان',
    'settings.billing': 'الفواتير',
    'theme.light': 'فاتح',
    'theme.dark': 'داكن',
    'theme.system': 'النظام',
    'language.select': 'اختر اللغة',
    'language.auto_translate': 'ترجمة تلقائية للمحتوى',
    'language.translate_to_english': 'ترجمة إلى الإنجليزية',
  },
  
  pt: {
    'nav.home': 'Inicio',
    'nav.courses': 'Cursos',
    'nav.my_learning': 'Meu Aprendizado',
    'nav.messages': 'Mensagens',
    'nav.skills': 'Habilidades',
    'nav.careers': 'Carreiras',
    'nav.community': 'Comunidade',
    'nav.settings': 'Configuracoes',
    'nav.help': 'Ajuda',
    'nav.logout': 'Sair',
    'common.search': 'Pesquisar',
    'common.filter': 'Filtrar',
    'common.sort': 'Ordenar',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Excluir',
    'common.edit': 'Editar',
    'common.view': 'Ver',
    'common.download': 'Baixar',
    'common.share': 'Compartilhar',
    'common.loading': 'Carregando...',
    'common.error': 'Erro',
    'common.success': 'Sucesso',
    'common.confirm': 'Confirmar',
    'common.back': 'Voltar',
    'common.next': 'Proximo',
    'common.previous': 'Anterior',
    'common.submit': 'Enviar',
    'common.continue': 'Continuar',
    'common.start': 'Iniciar',
    'common.finish': 'Finalizar',
    'common.close': 'Fechar',
    'auth.login': 'Entrar',
    'auth.signup': 'Cadastrar',
    'auth.logout': 'Sair',
    'auth.email': 'E-mail',
    'auth.password': 'Senha',
    'auth.forgot_password': 'Esqueceu a senha?',
    'auth.remember_me': 'Lembrar-me',
    'auth.create_account': 'Criar conta',
    'auth.already_have_account': 'Ja tem uma conta?',
    'auth.dont_have_account': 'Nao tem uma conta?',
    'course.enroll': 'Inscreva-se Agora',
    'course.enrolled': 'Inscrito',
    'course.start_learning': 'Comecar a Aprender',
    'course.continue': 'Continuar',
    'course.completed': 'Concluido',
    'course.certificate': 'Certificado',
    'course.lessons': 'Aulas',
    'course.duration': 'Duracao',
    'course.level': 'Nivel',
    'course.instructor': 'Instrutor',
    'course.students': 'Alunos',
    'course.rating': 'Avaliacao',
    'course.reviews': 'Comentarios',
    'course.curriculum': 'Curriculo',
    'course.overview': 'Visao geral',
    'course.free': 'Gratis',
    'dashboard.welcome': 'Bem-vindo de volta',
    'dashboard.continue_learning': 'Continuar Aprendendo',
    'dashboard.your_progress': 'Seu Progresso',
    'dashboard.recent_activity': 'Atividade Recente',
    'dashboard.recommended': 'Recomendado para voce',
    'dashboard.achievements': 'Conquistas',
    'settings.profile': 'Perfil',
    'settings.notifications': 'Notificacoes',
    'settings.privacy': 'Privacidade',
    'settings.appearance': 'Aparencia',
    'settings.language': 'Idioma',
    'settings.security': 'Seguranca',
    'settings.billing': 'Cobranca',
    'theme.light': 'Claro',
    'theme.dark': 'Escuro',
    'theme.system': 'Sistema',
    'language.select': 'Selecionar Idioma',
    'language.auto_translate': 'Traducao automatica de conteudo',
    'language.translate_to_english': 'Traduzir para ingles',
  },
  
  am: {
    'nav.home': 'መነሻ',
    'nav.courses': 'ኮርሶች',
    'nav.my_learning': 'ትምህርቴ',
    'nav.messages': 'መልእክቶች',
    'nav.skills': 'ክህሎቶች',
    'nav.careers': 'ስራዎች',
    'nav.community': 'ማህበረሰብ',
    'nav.settings': 'ቅንብሮች',
    'nav.help': 'እገዛ',
    'nav.logout': 'ውጣ',
    'common.search': 'ፈልግ',
    'common.save': 'አስቀምጥ',
    'common.cancel': 'ሰርዝ',
    'common.delete': 'ሰርዝ',
    'common.edit': 'አርትዕ',
    'common.loading': 'በመጫን ላይ...',
    'auth.login': 'ግባ',
    'auth.signup': 'ተመዝገብ',
    'course.enroll': 'አሁን ተመዝገብ',
    'theme.light': 'ብርሃን',
    'theme.dark': 'ጨለማ',
    'theme.system': 'ስርዓት',
    'language.select': 'ቋንቋ ይምረጡ',
    'language.translate_to_english': 'ወደ እንግሊዝኛ ተርጉም',
  },
  
  ha: {
    'nav.home': 'Gida',
    'nav.courses': 'Darussa',
    'nav.my_learning': 'Karatuna',
    'nav.messages': 'Sakonni',
    'nav.settings': 'Saituna',
    'nav.help': 'Taimako',
    'nav.logout': 'Fita',
    'common.search': 'Bincika',
    'common.save': 'Ajiye',
    'common.cancel': 'Soke',
    'auth.login': 'Shiga',
    'auth.signup': 'Yi Rajista',
    'course.enroll': 'Yi Rajista Yanzu',
    'theme.light': 'Haske',
    'theme.dark': 'Duhu',
    'theme.system': 'Tsarin',
    'language.select': 'Zabi Harshe',
    'language.translate_to_english': 'Fassara zuwa Turanci',
  },
  
  yo: {
    'nav.home': 'Ile',
    'nav.courses': 'Awon Eko',
    'nav.my_learning': 'Eko Mi',
    'nav.messages': 'Awon Ifiranso',
    'nav.settings': 'Eto',
    'nav.help': 'Iranlowo',
    'nav.logout': 'Jade',
    'common.search': 'Wa',
    'common.save': 'Fi Pamọ',
    'common.cancel': 'Fagile',
    'auth.login': 'Wole',
    'auth.signup': 'Forukọsilẹ',
    'course.enroll': 'Forukọsilẹ Bayi',
    'theme.light': 'Imọlẹ',
    'theme.dark': 'Okunkun',
    'theme.system': 'Eto',
    'language.select': 'Yan Ede',
    'language.translate_to_english': 'Tumọ si Gẹẹsi',
  },
  
  zu: {
    'nav.home': 'Ikhaya',
    'nav.courses': 'Izifundo',
    'nav.my_learning': 'Ukufunda Kwami',
    'nav.messages': 'Imilayezo',
    'nav.settings': 'Izilungiselelo',
    'nav.help': 'Usizo',
    'nav.logout': 'Phuma',
    'common.search': 'Sesha',
    'common.save': 'Gcina',
    'common.cancel': 'Khansela',
    'auth.login': 'Ngena',
    'auth.signup': 'Bhalisa',
    'course.enroll': 'Bhalisa Manje',
    'theme.light': 'Ukukhanya',
    'theme.dark': 'Ubumnyama',
    'theme.system': 'Isistimu',
    'language.select': 'Khetha Ulimi',
    'language.translate_to_english': 'Humusha ku-English',
  },
  
  ig: {
    'nav.home': 'Ulo',
    'nav.courses': 'Ihe omumu',
    'nav.my_learning': 'Mmuta m',
    'nav.messages': 'Ozi',
    'nav.settings': 'Ntọala',
    'nav.help': 'Enyemaka',
    'nav.logout': 'Puo',
    'common.search': 'Chọọ',
    'common.save': 'Chekwaa',
    'common.cancel': 'Kagbuo',
    'auth.login': 'Banye',
    'auth.signup': 'Debanye aha',
    'course.enroll': 'Debanye Aha Ugbu a',
    'theme.light': 'Ihe',
    'theme.dark': 'Ochichiri',
    'theme.system': 'Sistemụ',
    'language.select': 'Họrọ Asụsụ',
    'language.translate_to_english': 'Sụgharịa na Bekee',
  },
  
  so: {
    'nav.home': 'Guriga',
    'nav.courses': 'Koorsayaasha',
    'nav.my_learning': 'Waxbarashadayda',
    'nav.messages': 'Fariimaha',
    'nav.settings': 'Dejinta',
    'nav.help': 'Caawimaad',
    'nav.logout': 'Ka bax',
    'common.search': 'Raadi',
    'common.save': 'Keydi',
    'common.cancel': 'Jooji',
    'auth.login': 'Gal',
    'auth.signup': 'Isdiiwaangeli',
    'course.enroll': 'Hadda Isdiiwaangeli',
    'theme.light': 'Iftiinka',
    'theme.dark': 'Mugdiga',
    'theme.system': 'Nidaamka',
    'language.select': 'Dooro Luqadda',
    'language.translate_to_english': 'U tarjun Ingiriis',
  },
  
  rw: {
    'nav.home': 'Ahabanza',
    'nav.courses': 'Amasomo',
    'nav.my_learning': 'Amasomo yanjye',
    'nav.messages': 'Ubutumwa',
    'nav.settings': 'Igenamiterere',
    'nav.help': 'Ubufasha',
    'nav.logout': 'Sohoka',
    'common.search': 'Shakisha',
    'common.save': 'Bika',
    'common.cancel': 'Hagarika',
    'auth.login': 'Injira',
    'auth.signup': 'Iyandikishe',
    'course.enroll': 'Iyandikishe Nonaha',
    'theme.light': 'Urumuri',
    'theme.dark': 'Umwijima',
    'theme.system': 'Sisitemu',
    'language.select': 'Hitamo Ururimi',
    'language.translate_to_english': 'Hindura mu Cyongereza',
  },
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallback?: string) => string;
  autoTranslate: boolean;
  setAutoTranslate: (enabled: boolean) => void;
  translateToEnglish: (text: string) => Promise<string>;
  direction: 'ltr' | 'rtl';
  languageInfo: LanguageInfo;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [autoTranslate, setAutoTranslateState] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const storedLang = localStorage.getItem('language') as SupportedLanguage | null;
    const storedAutoTranslate = localStorage.getItem('autoTranslate');
    
    if (storedLang && SUPPORTED_LANGUAGES.find(l => l.code === storedLang)) {
      setLanguageState(storedLang);
    }
    
    if (storedAutoTranslate) {
      setAutoTranslateState(storedAutoTranslate === 'true');
    }
    
    setMounted(true);
  }, []);

  // Apply direction to document
  useEffect(() => {
    if (mounted) {
      const langInfo = SUPPORTED_LANGUAGES.find(l => l.code === language);
      if (langInfo) {
        document.documentElement.dir = langInfo.direction;
        document.documentElement.lang = language;
      }
    }
  }, [language, mounted]);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  }, []);

  const setAutoTranslate = useCallback((enabled: boolean) => {
    setAutoTranslateState(enabled);
    localStorage.setItem('autoTranslate', String(enabled));
  }, []);

  // Translation function
  const t = useCallback((key: string, fallback?: string): string => {
    const translations = UI_TRANSLATIONS[language];
    if (translations && translations[key]) {
      return translations[key];
    }
    // Fallback to English
    if (UI_TRANSLATIONS.en[key]) {
      return UI_TRANSLATIONS.en[key];
    }
    return fallback || key;
  }, [language]);

  // Simulate translation to English (in real app, would call translation API)
  const translateToEnglish = useCallback(async (text: string): Promise<string> => {
    // Simulated translation - in production, use Google Translate API or similar
    if (language === 'en') return text;
    
    // For demo, return original text with indicator
    return `[Translated] ${text}`;
  }, [language]);

  const languageInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  if (!mounted) {
    return (
      <LanguageContext.Provider value={{
        language: 'en',
        setLanguage: () => {},
        t: (key) => key,
        autoTranslate: false,
        setAutoTranslate: () => {},
        translateToEnglish: async (text) => text,
        direction: 'ltr',
        languageInfo: SUPPORTED_LANGUAGES[0],
      }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      autoTranslate,
      setAutoTranslate,
      translateToEnglish,
      direction: languageInfo.direction,
      languageInfo,
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
