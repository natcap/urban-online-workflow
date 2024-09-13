FROM node:20

# Just install the packages; the source code will be loaded in later.
RUN mkdir /opt/frontend
WORKDIR /opt/frontend

ADD ./package.json /opt/frontend/
ADD ./yarn.lock /opt/frontend/
RUN yarn --version
#RUN yarn install --production=false
RUN yarn install --frozen-lockfile

EXPOSE 3000

CMD yarn start-docker
