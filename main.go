package main

import (
    "github.com/FinanceSutra/FinanceSUTRA/shared"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "log"
)



func connectToPostgreSQL() (*gorm.DB, error) {
    dsn := "user=postgres password=Daksh@2706 dbname=FinanceSutra host=localhost port=5432 sslmode=disable"
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        return nil, err
    }

    return db, nil
}



// func createUser(db *gorm.DB, user *shared.User) error {
//     result := db.Create(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func getUserByID(db *gorm.DB, userID uint) (*shared.User, error) {
//     var user shared.User
//     result := db.First(&user, userID)
//     if result.Error != nil {
//         return nil, result.Error
//     }
//     return &user, nil
// }

// func updateUser(db *gorm.DB, user *shared.User) error {
//     result := db.Save(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func deleteUser(db *gorm.DB, user *shared.User) error {
//     result := db.Delete(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func createStrategy(db *gorm.DB, user *shared.Strategy) error {
//     result := db.Create(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func getStrategyByID(db *gorm.DB, userID uint) (*shared.Strategy, error) {
//     var user shared.Strategy
//     result := db.First(&user, userID)
//     if result.Error != nil {
//         return nil, result.Error
//     }
//     return &user, nil
// }

// func updateStrategy(db *gorm.DB, user *shared.Strategy) error {
//     result := db.Save(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func deleteStrategy(db *gorm.DB, user *shared.Strategy) error {
//     result := db.Delete(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func createBacktest(db *gorm.DB, user *shared.Backtest) error {
//     result := db.Create(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func getBacktestByID(db *gorm.DB, userID uint) (*shared.Backtest, error) {
//     var user shared.Backtest
//     result := db.First(&user, userID)
//     if result.Error != nil {
//         return nil, result.Error
//     }
//     return &user, nil
// }

// func updateBacktest(db *gorm.DB, user *shared.Backtest) error {
//     result := db.Save(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func deleteBacktest(db *gorm.DB, user *shared.Backtest) error {
//     result := db.Delete(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func createTrade(db *gorm.DB, user *shared.Trade) error {
//     result := db.Create(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func getTradeByID(db *gorm.DB, userID uint) (*shared.Trade, error) {
//     var user shared.Trade
//     result := db.First(&user, userID)
//     if result.Error != nil {
//         return nil, result.Error
//     }
//     return &user, nil
// }

// func updateTrade(db *gorm.DB, user *shared.Trade) error {
//     result := db.Save(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func deleteTrade(db *gorm.DB, user *shared.Trade) error {
//     result := db.Delete(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func createBrokerConnection(db *gorm.DB, user *shared.BrokerConnection) error {
//     result := db.Create(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func getBrokerConnectionByID(db *gorm.DB, userID uint) (*shared.BrokerConnection, error) {
//     var user shared.BrokerConnection
//     result := db.First(&user, userID)
//     if result.Error != nil {
//         return nil, result.Error
//     }
//     return &user, nil
// }

// func updateBrokerConnection(db *gorm.DB, user *shared.BrokerConnection) error {
//     result := db.Save(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func deleteBrokerConnection(db *gorm.DB, user *shared.BrokerConnection) error {
//     result := db.Delete(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func createMarketData(db *gorm.DB, user *shared.MarketData) error {
//     result := db.Create(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func getMarketDataByID(db *gorm.DB, userID uint) (*shared.MarketData, error) {
//     var user shared.MarketData
//     result := db.First(&user, userID)
//     if result.Error != nil {
//         return nil, result.Error
//     }
//     return &user, nil
// }

// func updateMarketData(db *gorm.DB, user *shared.MarketData) error {
//     result := db.Save(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func deleteMarketData(db *gorm.DB, user *shared.MarketData) error {
//     result := db.Delete(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func createDeployedStrategy(db *gorm.DB, user *shared.DeployedStrategy) error {
//     result := db.Create(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func getDeployedStrategyByID(db *gorm.DB, userID uint) (*shared.DeployedStrategy, error) {
//     var user shared.DeployedStrategy
//     result := db.First(&user, userID)
//     if result.Error != nil {
//         return nil, result.Error
//     }
//     return &user, nil
// }

// func updateDeployedStrategy(db *gorm.DB, user *shared.DeployedStrategy) error {
//     result := db.Save(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func deleteDeployedStrategy(db *gorm.DB, user *shared.DeployedStrategy) error {
//     result := db.Delete(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func createPortfolioRisk(db *gorm.DB, user *shared.PortfolioRisk) error {
//     result := db.Create(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func getPortfolioRiskByID(db *gorm.DB, userID uint) (*shared.PortfolioRisk, error) {
//     var user shared.PortfolioRisk
//     result := db.First(&user, userID)
//     if result.Error != nil {
//         return nil, result.Error
//     }
//     return &user, nil
// }

// func updatePortfolioRisk(db *gorm.DB, user *shared.PortfolioRisk) error {
//     result := db.Save(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func deletePortfolioRisk(db *gorm.DB, user *shared.PortfolioRisk) error {
//     result := db.Delete(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func createRiskLimit(db *gorm.DB, user *shared.RiskLimit) error {
//     result := db.Create(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func getRiskLimitByID(db *gorm.DB, userID uint) (*shared.RiskLimit, error) {
//     var user shared.RiskLimit
//     result := db.First(&user, userID)
//     if result.Error != nil {
//         return nil, result.Error
//     }
//     return &user, nil
// }

// func updateRiskLimit(db *gorm.DB, user *shared.RiskLimit) error {
//     result := db.Save(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func deleteRiskLimit(db *gorm.DB, user *shared.RiskLimit) error {
//     result := db.Delete(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func createPositionSizingRule(db *gorm.DB, user *shared.PositionSizingRule) error {
//     result := db.Create(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func getPositionSizingRuleByID(db *gorm.DB, userID uint) (*shared.PositionSizingRule, error) {
//     var user shared.PositionSizingRule
//     result := db.First(&user, userID)
//     if result.Error != nil {
//         return nil, result.Error
//     }
//     return &user, nil
// }

// func updatePositionSizingRule(db *gorm.DB, user *shared.PositionSizingRule) error {
//     result := db.Save(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func deletePositionSizingRule(db *gorm.DB, user *shared.PositionSizingRule) error {
//     result := db.Delete(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func createMarketExposure(db *gorm.DB, user *shared.MarketExposure) error {
//     result := db.Create(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func getMarketExposureByID(db *gorm.DB, userID uint) (*shared.MarketExposure, error) {
//     var user shared.MarketExposure
//     result := db.First(&user, userID)
//     if result.Error != nil {
//         return nil, result.Error
//     }
//     return &user, nil
// }

// func updateMarketExposure(db *gorm.DB, user *shared.MarketExposure) error {
//     result := db.Save(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func deleteMarketExposure(db *gorm.DB, user *shared.MarketExposure) error {
//     result := db.Delete(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func createSectorExposure(db *gorm.DB, user *shared.SectorExposure) error {
//     result := db.Create(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func getSectorExposureByID(db *gorm.DB, userID uint) (*shared.SectorExposure, error) {
//     var user shared.SectorExposure
//     result := db.First(&user, userID)
//     if result.Error != nil {
//         return nil, result.Error
//     }
//     return &user, nil
// }

// func updateSectorExposure(db *gorm.DB, user *shared.SectorExposure) error {
//     result := db.Save(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func deleteSectorExposure(db *gorm.DB, user *shared.SectorExposure) error {
//     result := db.Delete(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func createStrategyCorrelation(db *gorm.DB, user *shared.StrategyCorrelation) error {
//     result := db.Create(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func getStrategyCorrelationByID(db *gorm.DB, userID uint) (*shared.StrategyCorrelation, error) {
//     var user shared.StrategyCorrelation
//     result := db.First(&user, userID)
//     if result.Error != nil {
//         return nil, result.Error
//     }
//     return &user, nil
// }

// func updateStrategyCorrelation(db *gorm.DB, user *shared.StrategyCorrelation) error {
//     result := db.Save(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }

// func deleteStrategyCorrelation(db *gorm.DB, user *shared.StrategyCorrelation) error {
//     result := db.Delete(user)
//     if result.Error != nil {
//         return result.Error
//     }
//     return nil
// }


func main() {
    db, err := connectToPostgreSQL()
    if err != nil {
        log.Fatal(err)
    }
    sqlDB, err := db.DB()
    if err != nil {
        log.Fatal("failed to get DB from GORM:", err)
    }
    defer sqlDB.Close()

    // Perform database migration
    err = db.AutoMigrate(&shared.User{})
    if err != nil {
        log.Fatal(err)
    }

    // Create a user
    // newUser := &shared.User{Username: "Daksh", Email: "daksh@gmail.com", Password: "ok", FullName: "Daksh Jain"}
    // err = createUser(db, newUser)
    // if err != nil {
    //     log.Fatal(err)
    // }
    // log.Println("Created User:", newUser)

    // // Query user by ID
    // userID := newUser.ID
    // user, err := getUserByID(db, userID)
    // if err != nil {
    //     log.Fatal(err)
    // }
    // log.Println("User by ID:", user)

    // // Update user
    // user.Email = "updated_email@example.com"
    // err = updateUser(db, user)
    // if err != nil {
    //     log.Fatal(err)
    // }
    // log.Println("Updated User:", user)

    // Delete user
    // err = deleteUser(db, user)
    // if err != nil {
    //     log.Fatal(err)
    // }
    // log.Println("Deleted User:", user)
}
