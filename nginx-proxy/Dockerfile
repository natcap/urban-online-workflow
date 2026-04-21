FROM nginx:latest
ARG ENV 
COPY ./nginx-${ENV}.conf /etc/nginx/conf.d/default.conf

# You’ll notice that we did not add an ENTRYPOINT or a CMD to our Dockerfile. We will use the underlying ENTRYPOINT and CMD provided by the base NGINX image.
