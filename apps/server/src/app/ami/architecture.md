# Ami


The Artificial Monster Intelligence (AMI) system is an advanced software platform consisting of several interrelated services designed to provide interactive, AI-generated responses to user queries. At the system's entry point, the AI Service integrates functionalities of the Doc Refiner, Answer Builder, and Q/A Logger, allowing users to pose questions and receive responses. The Training Manager oversees multiple Training Services - Answer, Question, and Britannica, which use data from the Training Data Service to refine AI models. In support, the Db Service and Q/A Logger Service manage data interactions, while the Doc Refiner and Answer Builder work together to process and formulate high-quality, relevant responses to user queries.

![AMI DIAGRAM](https://firebasestorage.googleapis.com/v0/b/monster-mono-repo.appspot.com/o/projects%2Fami%2FBlank%20diagram-2.png?alt=media&token=eed6991d-1e04-4410-bb88-6945af79f939)

## Too Long, Dont Read
Imagine it as a large, automated factory with different departments working together to produce a product—in this case, smart and accurate responses to any questions you ask.

##### The Factory (AMI)

The AMI factory is a high-tech system with several different sections, each responsible for a specific job.

##### The Reception (AI Service)

When you ask a question, it first reaches the AI Service—think of it as the reception desk of our factory. Here, the receptionist makes sure your query is properly handled and sent to the correct departments. In this case, those are the Doc Refiner, Answer Builder, and Q/A Logger.

##### The Editing Department (Doc Refiner)

The Doc Refiner is like the editing department of a newspaper. Its job is to take in the raw information (documents) from the database, clean it up, and make it easier to understand.

##### The Production Line (Answer Builder)

Once the information is all neat and tidy, it's sent over to the Answer Builder. This is where your answer gets put together, like a car on a production line.

##### The Record Keeper (Q/A Logger)

While this is happening, the Q/A Logger is taking notes of the process. It's like a factory supervisor who records what's happening on the floor to find ways to improve the process in the future.

##### The Data Warehouse (Db Service)

The Db Service is like the factory's warehouse. It stores all the raw materials (data) and keeps track of everything that goes in and out.

##### The Training Department (Training Manager and Training Services)

Next, there's the Training Department, led by the Training Manager. Here, different teams (the Answer, Question, and Britannica Training Services) use data from the Training Data Service to improve how the factory works. They're like the factory's trainers, making sure all the machines are getting better and smarter at their jobs.

##### In Conclusion

So, all these parts of the AMI system work together to take your questions and turn them into accurate, helpful answers. The system is constantly learning and improving, just like a well-run factory aiming to make the best product possible.


## Required Classes
The Artificial Monster Intelligence (AMI) system showcases an intricate web of relationships among its components, enabling a seamless flow of information and operations. At the core, the AI Service serves as the entry point for consumers and integrates the functionalities of the Doc Refiner, Answer Builder, and Q/A Logger to handle user queries and generate responses.

The Doc Refiner, depending on the Db Service, refines documents to feed into the Answer Builder, which constructs the final answers to user queries. The Q/A Logger logs these interactions for future analysis and improvement, and relies on the Db Service for storage and retrieval of these logs.

In the training segment, the Training Manager orchestrates the Training Services (Answer, Question, and Britannica Training Services), which utilize data from the Training Data Service, itself dependent on the Training Manager. Each of these Training Services implements the I_Trainer interface to ensure a consistent training protocol, enhancing the overall performance of the system.

In essence, all services in the AMI system work together harmoniously, each contributing its unique functionality to provide an efficient, accurate, and robust AI response system.

### Db Service
As a core component of AMI (Artificial Monster Inteligence), the Db Service functions to ensure seamless interactions between AMI and its underlying database. The Db Service's operations are intricately linked to the Training Data Service, indicating that the Training Data Service is a vital supplier of data for the Db Service.

 this class provides a range of methods that facilitate various data manipulations and retrievals

#### Deps
- Training Data Service

#### Methods
- upVote(id): Answer
- downVote(id): Answer
- get version(): string
- saveQuestion(Question): id
- saveAnswer(Answer): id
- associateAnswerWithQuestion(questionId, AnswerId)
- getAnswers(ids): Answers

### Training Data Service
The Training Data Service in the Artificial Monster Intelligence (AMI) system is a crucial component that provides and manages data required for training various AI models. It is inherently dependent on the Training Manager, which controls the overall orchestration of the different Training Services such as Answer Training Service, Question Training Service, and Britannica Training Service.

#### Deps
- Training Manager

#### Methods
- upVote(id): Answer
- downVote(id): Answer
- getVersionNames(): Array<string>
- getVersion(id): Version
- train(type, version): void

### Training Manager
As a central hub in the AMI system, the Training Manager effectively manages and synchronizes the different Training Services, namely the Answer Training Service, Question Training Service, and Britannica Training Service. It organizes the entire training process and ensures smooth interaction and cooperation among the various training services.

#### Deps
- Answer Training Service 
- Question Training Service
- Brittanica Trianing Service

#### Methods
- train(type, state): void
- **private** createNewVersion(docs): Version
- **private** saveVersion(version): id
- **private** getState(version): 

### Answer Training Service implements I_Trainer
The Answer Training Service is a fundamental component of the Artificial Monster Intelligence (AMI) system that directly implements the I_Trainer interface. It holds the primary responsibility for training the AI models on generating responses or answers.

As a specialized service dedicated to enhancing the quality of AI-generated answers, the Answer Training Service provides several methods that contribute to a more robust and refined training process

#### Methods
- train(version): void
- **private** prune(Array<I_Answer>)
- **private** isGood(I_Answer): boolean

### Question Training Service implements I_Trainer
As an integral part of the Artificial Monster Intelligence (AMI) system, the Question Training Service adheres to the I_Trainer interface's structure. This service's primary function is to handle the training of AI models on understanding and processing user questions effectively and accurately.

#### Deps
- Vector Service

#### Methods
- train(version): void
- **private** cluster(Array<I_Question>) 
- **private** assignAnswers(centroid, questions)

### Brittanica Training Service implements I_Trainer
As a key segment of the Artificial Monster Intelligence (AMI) system, the Britannica Training Service abides by the I_Trainer interface's framework. This service's main role is to train the AI models using data sourced from the Monster's Britannica intranet, enhancing the models' ability to understand and provide information with a high degree of accuracy and depth.

The Britannica Training Service uses several methods, identical in nature to the other Training Services, but unique in their application, focusing on Britannica data

#### Deps
- Vector Service

#### Methods
- train(version): void
- **private** scrape()


### Vector Service
A fundamental component of the Artificial Monster Intelligence (AMI) system, the Vector Service, is responsible for handling and managing vectorized data. It's primary function lies in the creation, loading, and querying of vectorized data.

This service converts unstructured data into high dimensional vector space representations. This transformation aids the system in discerning patterns and making sense of complex, multidimensional data in a computationally efficient manner. The Vector Service then loads these representations into the system, and it can perform search queries on them based on cosine distance to determine similarity; this was chosen over eucledian distance because magnitude is a low relevence factor in this context. this facilitates efficient and accurate information retrieval.

The Vector Service interacts closely with the other services in the AMI system, providing them with essential vectorized data, which forms the basis for many of the AI's processing, learning, and decision-making capabilities.

#### Methods
- **private** loadVector(type: 'brittanica' | 'questions')
- **private** createVector(source: 'brittanica' | 'questions', docs)
- search(source: 'brittanica' | questions, query: string): Array\<doc\>

### Doc Refiner
The Doc Refiner serves as a vital element in the Artificial Monster Intelligence (AMI) system, playing a pivotal role in refining and optimizing documents to enhance the overall AI responses. This service depends directly on the Db Service, which provides necessary data for refining operations.

#### Deps
- Db Service
- Vector Service

#### Methods
- **private** refineAnswers(query: string, answer: Array<I_Answer>): string
- **private** refineBrittanica(Array<string>): string
- getRefinedDocuments(query: string) 

### AI Service
The AI Service is the primary entry point for consumers within the Artificial Monster Intelligence (AMI) system. It provides a unified interface through which users can interact with the system. The AI Service has dependencies on the Doc Refiner, Answer Builder, and Q/A Logger services, integrating their functionalities to provide a comprehensive user experience.

#### Deps
- Doc Refiner
- Answer Builder
- Q/A Logger

#### Methods
ask(query: string): string

### Answer Builder
Within the Artificial Monster Intelligence (AMI) system, the Answer Builder is a specialized service that constructs meaningful answers based on refined documents and user queries. It leverages the capabilities of the Q/A Logger to keep track of the question and answer pairs during its operations.

#### Deps
- Q/A Logger

#### Methods
buildAnswer(query, I_RefinedDocuments)


### Q/A Logger Service
The Q/A Logger Service is a crucial part of the Artificial Monster Intelligence (AMI) system, dedicated to tracking and logging the question and answer interactions. This service relies on the Db Service for storing and retrieving the logs from the database.

#### Deps
- Db Service

#### Methods
- **private** findDistance()
- **private** logQuestion(question, choices: Array<Question>)
- **private** logAnswer(answer, choices: Array<Answer>)
- logEntry(type, input, choices: Array<Question | Answer>)

