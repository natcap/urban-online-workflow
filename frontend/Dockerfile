FROM node:18-bullseye

# Just install the packages; the source code will be loaded in later.
RUN mkdir /opt/frontend
WORKDIR /opt/frontend

ADD ./package.json /opt/frontend/
RUN yarn install --production=false

# individual files in the parent directory need to be added here
ADD ./vite.config.js /opt/frontend/
ADD ./index.html /opt/frontend/
ADD ./env /opt/frontend

EXPOSE 3000

CMD yarn start-docker
