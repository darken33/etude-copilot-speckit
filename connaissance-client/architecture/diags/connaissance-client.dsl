workspace {

    model {
        user = person "Client" "Client de bankonet" "ExternalPerson"
        agent = person "Agent" "Agent de bankonet" "Person"
		idp = softwareSystem "IDP" "ADFS" "Software System"
		softwareExSystem = softwareSystem "Partenaire" "Paretnaire Externe" "External"
        softwareSystem = softwareSystem "Bankonet" "S.I. de Bankonet" "Software System" {
			mobile = container "Espace Client Mobile" "Espace Client Bankonet" "Android" "Mobile App" {
                user -> this
                this -> idp
            }
            espaceClient = container "Espace Client" "Espace Client Bankonet" "Angular" "Web Application" {
                user -> this
                this -> idp
            }
            ficheClient = container "Fiche Client" "Fiche Client Bankonet" "Angular" "Web Application" {
                agent -> this
                this -> idp
            }
            database = container "Database" "Stocker les fiche connaissances cients" "MongoDB" "Database"
            eventhub = container "EventHub" "Trans mettre les events" "Kafka" "Eventhub" {
				this -> softwareExSystem
            }
            api = container "Connaissance Client API" "Connaissance Client API" "Spring Boot" "Microservice" {
                dbAdapter = component "DB Adapter" "" {
					this -> database
                } 
                ehAdapter = component "EH Adapter" "" {
					this -> eventhub
                } 
                domain = component "Domaine" "" {
					this -> dbAdapter
					this -> ehAdapter
                }
                controller = component "Controller" "" {
					this -> domain
                }  
                espaceClient -> controller 
                mobile -> controller 
                ficheClient -> controller 
            }
        }
    }

    views {
        systemContext softwareSystem {
            include *
            autolayout lr
        }

        container softwareSystem {
            include *
        }

        component api {
            include *
            autolayout lr
        }

        theme default

		styles {
			element "ExternalPerson" {
				background #666666
				color #ffffff
			}
			element "External" {
				background #999999
				color #ffffff
			}
			element "Microservice" {
				background #438dd5
				color #ffffff
				shape Hexagon
			}
			element "Web Application" {
				shape WebBrowser
			}
			element "Mobile App" {
				shape MobileDevicePortrait
			}
			element "Database" {
				shape Cylinder
			}
			element "Eventhub" {
				shape Pipe
			}
		}

    }
}
