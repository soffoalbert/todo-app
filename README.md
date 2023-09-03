## Assumptions

I assumed the Task model should not have a description field or any other fields to augment its metadata for now as is the case on the Todoist third party app, because my long term vision would be to make it as interoperable as possible and that would entail delaying to incorporate a broader set of properties that might not be needed until there is a better understanding of the good amount of thrid party apps i am interested in integrating into.

## 3rd party integration setup - Todoist

This app uses Todist as the 3rd party app of choice for syncing todos. [click here to create an account and to follow the setup](https://todoist.com/)

## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development - NOTE: update the .env file before running this command and also make sure you setup localtunnel or any alternative to have the syncing working
$ yarn run start

# watch mode - NOTE: update the .env file before running this command and also make sure you setup localtunnel or any alternative to have the syncing working
$ yarn run start:dev

# production mode - NOTE: update the .env file before running this command and also make sure you setup localtunnel or any alternative to have the syncing working
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests - NOTE: update the .env file before running e2e tests 
$ yarn run test:e2e

# test coverage - NOTE: the coverage here is for unit tests therefore, graphQL resolvers as well as the todoist controller is not included. 
$ yarn run test:cov
```