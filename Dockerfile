FROM nginx:alpine

LABEL maintainer="dwaigx"
LABEL description="zodiac-dewey frontend static pages"

ARG APP_VERSION=dev

COPY . /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN find /usr/share/nginx/html -name "*.html" -exec sed -i -E "s/(index\\.css\\?v=)[^\"' ]+/\\1${APP_VERSION}/g; s/(index\\.js\\?v=)[^\"' ]+/\\1${APP_VERSION}/g" {} +

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
