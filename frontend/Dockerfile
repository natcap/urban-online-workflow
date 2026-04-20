FROM node:20

ARG PROD

# Just install the packages; the source code will be loaded in later.
RUN mkdir /opt/frontend
WORKDIR /opt/frontend

ADD ./package.json /opt/frontend/
ADD ./yarn.lock /opt/frontend/
#RUN yarn add puppeteer --ignore-scripts
RUN yarn install --production=${PROD}
#RUN yarn cache clean && yarn install --production=false

EXPOSE 3000

CMD yarn start-docker-dev
