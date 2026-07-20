import os
import environ
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

# ENV VARS

env = environ.Env() 

ENV = os.getenv("ENV", "docker")

if os.path.exists(os.path.join(BASE_DIR, f".env.{ENV}")):
    environ.Env.read_env(os.path.join(BASE_DIR, f".env.{ENV}"))

SECRET_KEY = env('SECRET_KEY')

DEBUG = True

ALLOWED_HOSTS = ['*']


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_extensions',
    'corsheaders',

    # apps
    'users_app',

    # dj-rest-auth
    'rest_framework',
    'rest_framework.authtoken', 
    'dj_rest_auth',
    'django.contrib.sites',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'dj_rest_auth.registration',

    # exporter
    'django_prometheus',
]

MIDDLEWARE = [
    'django_prometheus.middleware.PrometheusBeforeMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    'django_prometheus.middleware.PrometheusAfterMiddleware',
]

ROOT_URLCONF = 'users.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# Database

DATABASES = {
    "default": {
        "ENGINE": "django_prometheus.db.backends.postgresql",
        "NAME": env('POSTGRES_DB'),
        "USER": env('POSTGRES_USER'),
        "PASSWORD": env('POSTGRES_PASSWORD'),
        "HOST": env('DB_HOST'),
        "PORT": env('DB_PORT'),
    }
}


# REDIS CACHE

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://redis-svc:6379/2",
        "OPTIONS": {
            "COMPRESSOR": "django_redis.compressors.gzip.GzipCompressor",
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}


# CELERY

CELERY_BROKER_URL = "redis://redis-svc:6379/0"
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_BACKEND = "redis://redis-svc:6379/1"


#custom user model

AUTH_USER_MODEL = 'users_app.account'


#SIMPLE JWT AUTH

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1), 
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

#CORS

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3030',
    'http://localhost:5173',
    'http://localhost:5174',
    "https://unisotropous-lauren-persuadably.ngrok-free.dev",
    "https://app-5cacd864-779f-4f64-a831-73e859e46fdc.cleverapps.io",
    "http://localhost",
    "http://react",
]

CSRF_TRUSTED_ORIGINS = [
    'https://unisotropous-lauren-persuadably.ngrok-free.dev',
]


CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# AUTH

REST_AUTH = {
    'USER_DETAILS_SERIALIZER': 'Users.serializers.UserInfo',
    'USE_JWT': True,
    'JWT_AUTH_COOKIE': 'jwt-auth',
    'USER_DETAILS_SERIALIZER': 'users_app.serializers.CustomUserDetailsSerializer',
}

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
ACCOUNT_AUTHENTICATION_METHOD = 'email'  
ACCOUNT_EMAIL_REQUIRED = True           
ACCOUNT_UNIQUE_EMAIL = True
SITE_ID = 2

# EMAIL_BACKEND                       = 'django.core.mail.backends.console.EmailBackend'
# ACCOUNT_AUTHENTICATION_METHOD       = 'email'  
# ACCOUNT_EMAIL_REQUIRED              = True           
# ACCOUNT_UNIQUE_EMAIL                = True
# SITE_ID                             = 2
# ACCOUNT_EMAIL_VERIFICATION          = "mandatory"
# ACCOUNT_USERNAME_REQUIRED           = False

# # EMAIL

# EMAIL_BACKEND                       = "django.core.mail.backends.smtp.EmailBackend"
# EMAIL_HOST                          = "smtp.gmail.com"
# EMAIL_PORT                          = 587
# EMAIL_USE_TLS                       = True

# EMAIL_HOST_USER                     = env('EMAIL_USER')
# EMAIL_HOST_PASSWORD                 = env('EMAIL_PASS')

# DEFAULT_FROM_EMAIL                  = "Mates <om3309967@gmail.com>"


# Password validation

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)

STATIC_URL = 'static/'

STATICFILES_DIRS = [
    os.path.join(BASE_DIR,'static')
]

MEDIA_URL = 'media/'

MEDIA_ROOT = os.path.join(BASE_DIR , 'media')
