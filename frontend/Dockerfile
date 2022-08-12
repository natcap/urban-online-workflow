FROM node:18-bullseye

# Just install the packages; the source code will be loaded in later.
RUN mkdir /opt/frontend
WORKDIR /opt/frontend

ADD ./package.json /opt/frontend/
RUN yarn install --production=false

EXPOSE 3000

CMD yarn start-docker
