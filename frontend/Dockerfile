FROM node:20

# Just install the packages; the source code will be loaded in later.
RUN mkdir /opt/frontend
WORKDIR /opt/frontend

ADD ./package.json /opt/frontend/
RUN yarn add puppeteer --ignore-scripts
RUN yarn install --production=false
#RUN yarn cache clean && yarn install --production=false

EXPOSE 3000

CMD yarn start-docker
